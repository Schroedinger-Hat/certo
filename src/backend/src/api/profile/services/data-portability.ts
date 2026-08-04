/**
 * Self-service data export/import for a profile's own data - "take your
 * data with you" (no vendor lock-in), distinct from
 * `api::credential.credential`'s `import`/`export` actions and
 * `open-badge.ts`'s `importCredential()`, which handle a single
 * externally-issued OB3 VC. This is a full JSON snapshot of everything a
 * profile created or was issued, and a way to restore it into a fresh
 * instance under that same profile.
 */

interface ExportBundle {
  profile: Record<string, any>;
  achievementsCreated: Record<string, any>[];
  credentialsIssued: Record<string, any>[];
  credentialsReceived: Record<string, any>[];
  evidence: Record<string, any>[];
}

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Gathers everything associated with a profile: achievements it created,
   * credentials it issued or received, and evidence attached to any
   * exported credential. Credential "ownership" here follows
   * `credential.issuer`/`credential.recipient` (the same fields
   * verification.ts and signing already treat as authoritative), not
   * `achievement.creator`.
   */
  async exportProfileData(profile: { id: number | string }): Promise<ExportBundle> {
    const [achievementsCreated, credentialsIssued, credentialsReceived] = await Promise.all([
      strapi.entityService.findMany('api::achievement.achievement', {
        filters: { creator: profile.id },
        status: 'published',
        populate: ['criteria', 'alignment', 'skills', 'image'],
      }),
      strapi.entityService.findMany('api::credential.credential', {
        filters: { issuer: profile.id },
        status: 'published',
        populate: ['achievement', 'recipient', 'proof', 'evidence'],
      }),
      strapi.entityService.findMany('api::credential.credential', {
        filters: { recipient: profile.id },
        status: 'published',
        populate: ['achievement', 'issuer', 'proof', 'evidence'],
      }),
    ]);

    const evidence = (credentialsIssued as any[]).flatMap((credential) => credential.evidence || []);

    return {
      profile,
      achievementsCreated,
      credentialsIssued,
      credentialsReceived,
      evidence,
    };
  },

  /**
   * Restores achievements and issued credentials from a previously-exported
   * bundle into the caller's own profile. Never touches
   * `credentialsReceived` (claiming to have received a credential someone
   * else issued is what the external-VC import flow is for, not this one),
   * and never re-signs anything - imported credentials keep their original
   * `proof` as-is, since this is a data restore, not a re-issuance.
   *
   * Idempotent: achievements/credentials/evidence already present (matched
   * by their natural unique key) are skipped, never overwritten.
   */
  async importProfileData(profile: { id: number | string }, bundle: Partial<ExportBundle>) {
    const credentialService = strapi.service('api::credential.credential');

    const achievementIdMap = new Map<string, number>();
    const achievementsImported: string[] = [];
    const achievementsSkipped: string[] = [];

    for (const achievement of bundle.achievementsCreated || []) {
      const existing = await strapi.db.query('api::achievement.achievement').findOne({
        where: { achievementId: achievement.achievementId },
      });

      if (existing) {
        achievementIdMap.set(achievement.achievementId, existing.id);
        achievementsSkipped.push(achievement.achievementId);
        continue;
      }

      const created = await strapi.entityService.create('api::achievement.achievement', {
        data: {
          name: achievement.name,
          description: achievement.description,
          achievementType: achievement.achievementType,
          achievementId: achievement.achievementId,
          tags: achievement.tags,
          criteria: achievement.criteria,
          alignment: achievement.alignment,
          skills: achievement.skills,
          creator: profile.id,
          publishedAt: new Date(),
        },
      });
      achievementIdMap.set(achievement.achievementId, created.id);
      achievementsImported.push(achievement.achievementId);
    }

    const credentialsImported: string[] = [];
    const credentialsSkipped: string[] = [];

    for (const credential of bundle.credentialsIssued || []) {
      const existing = await strapi.db.query('api::credential.credential').findOne({
        where: { credentialId: credential.credentialId },
      });

      if (existing) {
        credentialsSkipped.push(credential.credentialId);
        continue;
      }

      const achievementId = credential.achievement?.achievementId
        ? achievementIdMap.get(credential.achievement.achievementId)
        : undefined;

      const recipientEntity = await credentialService.findOrCreateRecipientProfile(
        credential.recipient?.id
          ? { id: credential.recipient.id }
          : { email: credential.recipient?.email, name: credential.recipient?.name }
      );

      const created = await strapi.entityService.create('api::credential.credential', {
        data: {
          credentialId: credential.credentialId,
          name: credential.name,
          description: credential.description,
          type: credential.type,
          narrative: credential.narrative,
          issuanceDate: credential.issuanceDate,
          expirationDate: credential.expirationDate,
          revoked: credential.revoked,
          revocationReason: credential.revocationReason,
          achievement: achievementId,
          issuer: profile.id,
          recipient: recipientEntity.id,
          proof: credential.proof,
          publishedAt: new Date(),
        },
      });
      credentialsImported.push(credential.credentialId);

      for (const item of credential.evidence || []) {
        const existingEvidence = await strapi.db.query('api::evidence.evidence').findOne({
          where: { evidenceId: item.evidenceId },
        });
        if (existingEvidence) continue;

        await strapi.entityService.create('api::evidence.evidence', {
          data: {
            name: item.name,
            description: item.description,
            narrative: item.narrative,
            genre: item.genre,
            audience: item.audience,
            url: item.url,
            evidenceId: item.evidenceId,
            credential: created.id,
            publishedAt: new Date(),
          },
        });
      }
    }

    return {
      achievementsImported,
      achievementsSkipped,
      credentialsImported,
      credentialsSkipped,
    };
  },
});
