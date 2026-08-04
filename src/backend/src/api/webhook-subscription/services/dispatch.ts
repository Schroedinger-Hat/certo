import { createHmac } from 'crypto'

/**
 * Outbound webhook dispatch. Fire-and-forget: failures are logged, not
 * retried (a retry queue needs a job runner, out of scope for this first
 * pass). Delivery uses Node's global fetch - no new HTTP client dependency.
 *
 * Registered as a Strapi service (strapi.service('api::webhook-subscription.dispatch')),
 * matching the api::profile.issuer-keys / api::revocation-list.revocation-list
 * convention used elsewhere.
 */
export default ({ strapi }: { strapi: any }) => ({
  /**
   * Notify every enabled subscription registered for `event`.
   */
  async dispatch(event: string, payload: Record<string, unknown>) {
    const subscriptions = await strapi.entityService.findMany('api::webhook-subscription.webhook-subscription', {
      filters: { enabled: true },
    })

    const matching = (subscriptions || []).filter(
      (sub: any) => Array.isArray(sub.events) && sub.events.includes(event)
    )
    if (matching.length === 0) return

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload })

    await Promise.all(matching.map((sub: any) => this.deliver(sub, event, body)))
  },

  /**
   * Deliver one signed payload to one subscription, swallowing/logging
   * errors so one bad endpoint can't affect others or the caller.
   */
  async deliver(subscription: { url: string; secret: string }, event: string, body: string) {
    const signature = createHmac('sha256', subscription.secret).update(body).digest('hex')

    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Certo-Signature': signature,
          'X-Certo-Event': event,
        },
        body,
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) {
        strapi.log.warn(`[webhook] delivery to ${subscription.url} for ${event} failed: HTTP ${response.status}`)
      }
    } catch (error: any) {
      strapi.log.warn(`[webhook] delivery to ${subscription.url} for ${event} failed: ${error.message}`)
    }
  },
})
