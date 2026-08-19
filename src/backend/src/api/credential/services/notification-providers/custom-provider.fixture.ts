import type { NotificationProvider } from './types'

export function createNotificationProvider(): NotificationProvider {
  return {
    sendCredentialIssued: async () => {},
    sendExpirationWarning: async () => {},
  }
}
