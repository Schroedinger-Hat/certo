/**
 * Scheduled Issuance Scanner
 *
 * Processes pending scheduled issuances whose scheduledDate has arrived.
 * Called daily from bootstrap (setInterval) and on-demand via the
 * POST /api/scheduled-issuances/run-check endpoint.
 */

export default () => ({
  /**
   * Find all pending issuances whose scheduledDate is now or in the past.
   */
  async findDue(): Promise<any[]> {
    return strapi.entityService.findMany('api::scheduled-issuance.scheduled-issuance' as any, {
      filters: {
        status: 'pending',
        scheduledDate: { $lte: new Date().toISOString() },
      } as any,
    });
  },

  /**
   * Process a single scheduled issuance: issue the credential and update status.
   */
  async processOne(item: any): Promise<boolean> {
    try {
      const achievement = await strapi.entityService.findOne('api::achievement.achievement', item.achievementId, {
        populate: ['creator'],
      });

      if (!achievement) {
        await strapi.entityService.update('api::scheduled-issuance.scheduled-issuance' as any, item.id, {
          data: { status: 'failed', failureReason: `Achievement ${item.achievementId} not found` } as any,
        });
        return false;
      }

      const credentialService = strapi.service('api::credential.credential');
      const recipient = await (credentialService as any).findOrCreateRecipientProfile({
        email: item.recipientEmail,
        name: item.recipientName || item.recipientEmail.split('@')[0],
      });

      const credential = await credentialService.issue(
        achievement,
        recipient,
        [],
        item.expirationDate ? new Date(item.expirationDate).toISOString() : undefined,
        item.scheduledById ?? undefined,
      );

      await strapi.entityService.update('api::scheduled-issuance.scheduled-issuance' as any, item.id, {
        data: {
          status: 'issued',
          issuedCredentialId: credential?.credentialId ?? null,
        } as any,
      });

      const auditLog = strapi.service('api::audit-log-entry.audit-log');
      await auditLog.record({
        action: 'scheduled_issuance.issued',
        entityType: 'scheduled-issuance',
        entityId: String(item.id),
        actorType: 'system',
        metadata: { credentialId: credential?.credentialId, recipientEmail: item.recipientEmail },
      });

      strapi.log.info(`[scheduled-issuance] Issued credential ${credential?.credentialId} to ${item.recipientEmail} (scheduled item #${item.id})`);
      return true;
    } catch (err: any) {
      strapi.log.error(`[scheduled-issuance] Failed to process item #${item.id}: ${err.message}`);
      await strapi.entityService.update('api::scheduled-issuance.scheduled-issuance' as any, item.id, {
        data: { status: 'failed', failureReason: err.message } as any,
      });
      return false;
    }
  },

  /**
   * Run the full daily check — finds all due issuances and processes them.
   */
  async runDailyCheck(): Promise<{ processed: number; issued: number; failed: number }> {
    const due = await this.findDue();
    let issued = 0;
    let failed = 0;

    for (const item of due) {
      const success = await this.processOne(item);
      if (success) issued++;
      else failed++;
    }

    strapi.log.info(`[scheduled-issuance] Daily check: ${due.length} due, ${issued} issued, ${failed} failed`);
    return { processed: due.length, issued, failed };
  },
});
