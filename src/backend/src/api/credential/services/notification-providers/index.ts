import { createStrapiEmailProvider } from './strapi-email-provider'
import type { NotificationProvider } from './types'

export type { NotificationProvider, NotificationPayload, ExpirationWarningPayload } from './types'

/**
 * Resolves which notification provider to use for credential-issued
 * notifications. Configurable via config/plugins.ts or env
 * (custom.notificationProvider), defaulting to the Strapi email plugin.
 * Deployments can provide a custom module through
 * NOTIFICATION_PROVIDER_MODULE. The module must export a factory function
 * receiving Strapi and returning a NotificationProvider.
 */
export function getNotificationProvider(strapi: any): NotificationProvider {
  const name = strapi.config.get('custom.notificationProvider', 'strapi-email')
  const modulePath = strapi.config.get('custom.notificationProviderModule', '')

  if (modulePath) {
    try {
      const loaded = require(modulePath) as {
        default?: (strapi: any) => unknown
        createNotificationProvider?: (strapi: any) => unknown
      }
      const factory = loaded.createNotificationProvider ?? loaded.default
      const provider = typeof factory === 'function' ? factory(strapi) : undefined

      if (isNotificationProvider(provider)) {
        return provider
      }

      strapi.log?.warn?.(`Notification provider module "${modulePath}" did not return a valid provider`)
    }
    catch (error) {
      strapi.log?.warn?.(`Unable to load notification provider module "${modulePath}"`, error)
    }
  }

  switch (name) {
    case 'strapi-email':
    default:
      return createStrapiEmailProvider(strapi)
  }
}

function isNotificationProvider(value: unknown): value is NotificationProvider {
  if (!value || typeof value !== 'object') return false
  const provider = value as Partial<NotificationProvider>
  return typeof provider.sendCredentialIssued === 'function'
    && typeof provider.sendExpirationWarning === 'function'
}
