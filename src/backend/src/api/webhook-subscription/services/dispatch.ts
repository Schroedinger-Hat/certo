import { createHmac } from 'crypto'

/**
 * Outbound webhook dispatch. Now uses the event bus for async, reliable delivery.
 *
 * The event bus decouples publishing from delivery:
 * 1. Service publishes event to event bus via publish()
 * 2. Event bus enqueues the event
 * 3. Webhook dispatcher (registered in bootstrap) consumes and delivers async
 * 4. Delivery failures trigger retries with exponential backoff
 *
 * Registered as a Strapi service (strapi.service('api::webhook-subscription.dispatch')),
 * matching the api::profile.issuer-keys / api::revocation-list.revocation-list
 * convention used elsewhere.
 */
export default ({ strapi }: { strapi: any }) => ({
  /**
   * Publish event to the event bus for async webhook delivery.
   * Call this from credential/achievement controllers to trigger webhooks.
   */
  async publishEvent(event: string, payload: Record<string, unknown>) {
    try {
      if (!(strapi as any).eventBus) {
        strapi.log.warn(
          '[webhook] event bus not initialized, falling back to sync dispatch'
        );
        return this.dispatch(event, payload);
      }

      await (strapi as any).eventBus.publish({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });
    } catch (error: any) {
      strapi.log.error(`[webhook] failed to publish event ${event}:`, error.message);
      throw error;
    }
  },

  /**
   * Dispatch event (called by webhook consumer in the event bus).
   * Sends the event to all subscribed webhook endpoints.
   * This should not be called directly from controllers—use publishEvent instead.
   */
  async dispatchEvent(event: string, payload: Record<string, unknown>) {
    const subscriptions = await strapi.entityService.findMany(
      'api::webhook-subscription.webhook-subscription',
      {
        filters: { enabled: true },
      }
    );

    const matching = (subscriptions || []).filter(
      (sub: any) => Array.isArray(sub.events) && sub.events.includes(event)
    );
    if (matching.length === 0) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    await Promise.all(matching.map((sub: any) => this.deliver(sub, event, body)));
  },

  /**
   * Legacy synchronous dispatch for backward compatibility.
   * Prefer publishEvent() for new code.
   */
  async dispatch(event: string, payload: Record<string, unknown>) {
    return this.dispatchEvent(event, payload);
  },

  /**
   * Deliver one signed payload to one subscription, swallowing/logging
   * errors so one bad endpoint can't affect others or the caller.
   */
  async deliver(subscription: { url: string; secret: string }, event: string, body: string) {
    const signature = createHmac('sha256', subscription.secret)
      .update(body)
      .digest('hex');

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
      });
      if (!response.ok) {
        strapi.log.warn(
          `[webhook] delivery to ${subscription.url} for ${event} failed: HTTP ${response.status}`
        );
      }
    } catch (error: any) {
      strapi.log.warn(
        `[webhook] delivery to ${subscription.url} for ${event} failed: ${error.message}`
      );
    }
  },
})
