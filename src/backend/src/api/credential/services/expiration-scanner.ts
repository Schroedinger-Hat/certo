/**
 * Expiration Scanner Service
 *
 * Scans credentials for upcoming expiration and sends warning emails.
 * Deduplicates notifications via the audit log — an email is sent at most once
 * per (credential, window) pair, where windows are "30d", "7d", and "1d".
 *
 * Designed to be called:
 *   - Daily from bootstrap (setInterval) — see src/index.ts
 *   - On demand via POST /api/credentials/expiration-check (admin-only)
 *   - Manually via a K8s CronJob or system cron hitting that endpoint
 */

import { getNotificationProvider } from './notification-providers'

/** Warning windows: send a notification when expiry is within this many days */
const WARNING_WINDOWS = [30, 7, 1]

export default () => ({
  /**
   * Find all active (non-revoked, non-already-expired) credentials that expire
   * within `days` days from now.
   */
  async findExpiringSoon(days: number) {
    const now = new Date()
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    return strapi.entityService.findMany('api::credential.credential', {
      filters: {
        expirationDate: {
          $gte: now.toISOString(),
          $lte: cutoff.toISOString(),
        },
        revoked: { $ne: true },
      } as any,
      populate: ['achievement', 'recipient'] as any,
    })
  },

  /**
   * Check whether an expiration warning for a given window has already been
   * sent for this credential by querying the audit log.
   */
  async wasAlreadyNotified(credentialId: string, windowLabel: string): Promise<boolean> {
    const entries = await strapi.entityService.findMany('api::audit-log-entry.audit-log-entry', {
      filters: {
        action: `expiration_warning_${windowLabel}`,
        entityType: 'credential',
        entityId: credentialId,
        actorType: 'system',
      } as any,
      limit: 1,
    })
    return (entries as any[]).length > 0
  },

  /**
   * Record that a warning was sent so we don't send it again.
   */
  async recordNotification(credentialId: string, windowLabel: string) {
    await strapi.entityService.create('api::audit-log-entry.audit-log-entry', {
      data: {
        action: `expiration_warning_${windowLabel}`,
        entityType: 'credential',
        entityId: credentialId,
        actorType: 'system',
        metadata: { sentAt: new Date().toISOString() },
      },
    })
  },

  /**
   * Send a warning email for a single credential, if not already sent for
   * the given window.
   */
  async notifyIfNeeded(credential: any, windowDays: number): Promise<boolean> {
    if (!credential.recipient?.email) return false

    const windowLabel = `${windowDays}d`
    const credentialId = credential.credentialId || String(credential.id)

    const alreadySent = await this.wasAlreadyNotified(credentialId, windowLabel)
    if (alreadySent) return false

    const expirationDate = new Date(credential.expirationDate)
    const now = new Date()
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const frontendUrl = strapi.config.get('custom.frontendUrl', 'http://localhost:3000')

    try {
      const notificationProvider = getNotificationProvider(strapi)
      await notificationProvider.sendExpirationWarning({
        to: credential.recipient.email,
        achievement: { name: credential.achievement?.achievementType || credential.achievement?.name || 'Your Credential' },
        credential: { credentialId, id: credential.id },
        frontendUrl,
        user: null,
        daysLeft,
        expirationDate,
      })

      await this.recordNotification(credentialId, windowLabel)
      strapi.log.info(`[expiration-scanner] Sent ${windowLabel} warning for credential ${credentialId}`)
      return true
    } catch (err: any) {
      strapi.log.error(`[expiration-scanner] Failed to send warning for ${credentialId}: ${err.message}`)
      return false
    }
  },

  /**
   * Run the full daily expiration check across all warning windows.
   * Returns a summary of how many notifications were sent.
   */
  async runDailyCheck(): Promise<{ checked: number; notified: number; errors: number }> {
    if (strapi.config.get('custom.expirationNotificationsEnabled', true) as any === false) {
      strapi.log.info('[expiration-scanner] Expiration notifications disabled via config, skipping.')
      return { checked: 0, notified: 0, errors: 0 }
    }

    let checked = 0
    let notified = 0
    let errors = 0

    for (const windowDays of WARNING_WINDOWS) {
      try {
        const expiring = await this.findExpiringSoon(windowDays)
        for (const credential of expiring as any[]) {
          checked++
          const sent = await this.notifyIfNeeded(credential, windowDays)
          if (sent) notified++
        }
      } catch (err: any) {
        errors++
        strapi.log.error(`[expiration-scanner] Error during ${windowDays}d window check: ${err.message}`)
      }
    }

    strapi.log.info(`[expiration-scanner] Daily check complete: ${checked} checked, ${notified} notified, ${errors} errors`)
    return { checked, notified, errors }
  },
})
