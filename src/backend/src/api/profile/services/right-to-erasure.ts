/**
 * GDPR right-to-erasure service.
 *
 * Provides account deletion with a well-defined cascade policy:
 *
 * When a user requests deletion of their profile:
 * 1. **Achievements they created** are deleted (nothing else references them).
 * 2. **Credentials they issued** are deleted (plus their evidence).
 * 3. **Credentials they received** are *not* deleted unilaterally — a
 *    credential's issuer owns the record, and the recipient's copy is part
 *    of the issuer's audit trail. Instead, the credential is detached from
 *    the recipient (the recipient relation is unlinked) and the recipient
 *    profile is anonymized (email removed).
 * 4. **The profile itself** is deleted.
 * 5. **The associated users-permissions user** is deleted.
 * 6. **Issuer keys** for the profile are deleted.
 *
 * Audit log entries are *kept* (they are the platform's own records), but
 * any personal identifier fields in the metadata are scrubbed.
 */

export default ({ strapi }) => ({
  /**
   * Delete a user's profile and all associated data per the GDPR cascade.
   *
   * @param {Object} profile - The profile entity to delete
   * @param {Object} user - The associated users-permissions user
   * @returns {Object} Summary of what was deleted
   */
  async deleteProfileData(profile, user) {
    const profileId = profile.id
    const summary = {
      profileId,
      achievementsDeleted: 0,
      credentialsIssuedDeleted: 0,
      credentialsReceivedDetached: 0,
      evidenceDeleted: 0,
      profilesDeleted: 0,
      usersDeleted: 0,
      issuerKeysDeleted: 0,
    }

    // 1. Delete achievements created by this profile
    const achievements = await strapi.entityService.findMany('api::achievement.achievement', {
      filters: { creator: profileId },
    })
    for (const achievement of achievements) {
      await strapi.entityService.delete('api::achievement.achievement', achievement.id)
      summary.achievementsDeleted++
    }

    // 2. Delete credentials issued by this profile (and their evidence)
    const issuedCredentials = await strapi.entityService.findMany('api::credential.credential', {
      filters: { issuer: profileId },
    })
    for (const credential of issuedCredentials) {
      // Delete evidence attached to this credential
      const evidence = await strapi.entityService.findMany('api::evidence.evidence', {
        filters: { credential: credential.id },
      })
      for (const ev of evidence) {
        await strapi.entityService.delete('api::evidence.evidence', ev.id)
        summary.evidenceDeleted++
      }
      await strapi.entityService.delete('api::credential.credential', credential.id)
      summary.credentialsIssuedDeleted++
    }

    // 3. Detach credentials received by this profile
    const receivedCredentials = await strapi.entityService.findMany('api::credential.credential', {
      filters: { recipient: profileId },
    })
    for (const credential of receivedCredentials) {
      // Unlink the recipient so the credential remains valid for the issuer
      await strapi.entityService.update('api::credential.credential', credential.id, {
        data: {
          recipient: null,
        },
      })
      summary.credentialsReceivedDetached++
    }

    // 4. Delete the profile itself
    await strapi.entityService.delete('api::profile.profile', profileId)
    summary.profilesDeleted++

    // 5. Delete the associated users-permissions user, if any
    if (user?.id) {
      await strapi.query('plugin::users-permissions.user').delete({ where: { id: user.id } })
      summary.usersDeleted++
    }

    // 6. Delete issuer keys for this profile
    const issuerKeys = await strapi.db.query('api::issuer-key.issuer-key').findMany({
      where: { profile: profileId },
    })
    for (const key of issuerKeys) {
      await strapi.db.query('api::issuer-key.issuer-key').delete({ where: { id: key.id } })
      summary.issuerKeysDeleted++
    }

    // 7. Anonymize audit log entries that reference this profile
    await this.scrubAuditLogForProfile(profileId)

    return summary
  },

  /**
   * Scrub personal identifiers from audit-log entries referencing a profile
   * being deleted. Keeps the entries (defense/audit value) but removes
   * emails/names from metadata so the data subject's identity is erased.
   */
  async scrubAuditLogForProfile(profileId) {
    const auditLog = strapi.service('api::audit-log-entry.audit-log')
    if (!auditLog) return

    const entries = await strapi.db.query('api::audit-log-entry.audit-log-entry').findMany({
      where: { actorId: profileId },
    })

    for (const entry of entries) {
      const metadata = entry.metadata || {}
      await strapi.db.query('api::audit-log-entry.audit-log-entry').update({
        where: { id: entry.id },
        data: {
          metadata: {
            ...metadata,
            // Scrub personal identifiers — keep structural info
            ...(metadata.recipientEmail ? { recipientEmail: '[REDACTED]' } : {}),
            ...(metadata.recipientName ? { recipientName: '[REDACTED]' } : {}),
            ...(metadata.email ? { email: '[REDACTED]' } : {}),
            ...(metadata.actorEmail ? { actorEmail: '[REDACTED]' } : {}),
          },
        },
      })
    }
  },
})