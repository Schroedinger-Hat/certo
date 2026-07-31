import { createStrapiEmailProvider } from './strapi-email-provider'
import type { NotificationProvider } from './types'

export type { NotificationProvider, NotificationPayload } from './types'

/**
 * Resolves which notification provider to use for credential-issued
 * notifications. Configurable via config/plugins.ts or env
 * (custom.notificationProvider), defaulting to the Strapi email plugin.
 * Add new cases here (e.g. 'ses', 'mailgun') as real alternate providers
 * are implemented - none exist yet.
 */
export function getNotificationProvider(strapi: any): NotificationProvider {
  const name = strapi.config.get('custom.notificationProvider', 'strapi-email')

  switch (name) {
    case 'strapi-email':
    default:
      return createStrapiEmailProvider(strapi)
  }
}
