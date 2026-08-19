/**
 * Event Bus - Decoupled, reliable event publishing and consumption.
 *
 * Provides a provider-agnostic abstraction for domain events. Events are:
 * - Published once (fire-and-forget is NOT an option)
 * - Consumed by one or more listeners
 * - Optionally persisted for replay/durability
 *
 * Supported providers:
 * - memory: in-process queue (dev, testing, single-instance deployments)
 * - redis: Redis Streams (production, distributed)
 *
 * Usage:
 *
 *   const eventBus = await createEventBus({ strapi });
 *
 *   // Publish
 *   await eventBus.publish('credential.issued', { credentialId: '123' });
 *
 *   // Subscribe
 *   eventBus.subscribe('credential.issued', async (event) => {
 *     await dispatchWebhook(event);
 *   });
 *
 *   // Start consumer (in worker or bootstrap)
 *   await eventBus.startConsumer();
 */

export interface DomainEvent {
  event: string
  timestamp: string
  data: Record<string, unknown>
  id?: string
  retries?: number
}

export interface EventBusProvider {
  publish(event: DomainEvent): Promise<void>
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void
  startConsumer(): Promise<void>
  stopConsumer(): Promise<void>
  isRunning(): boolean
}

export interface EventBusConfig {
  provider?: 'memory' | 'redis'
  redis?: {
    host?: string
    port?: number
    password?: string
    db?: number
  }
}

export async function createEventBus(config: EventBusConfig = {}): Promise<EventBusProvider> {
  const provider = config.provider || process.env.EVENT_BUS_PROVIDER || 'memory'

  if (provider === 'redis') {
    const { RedisEventBus } = await import('./providers/redis-event-bus')
    return new RedisEventBus(config.redis || {})
  }

  // Default to memory
  const { MemoryEventBus } = await import('./providers/memory-event-bus')
  return new MemoryEventBus()
}
