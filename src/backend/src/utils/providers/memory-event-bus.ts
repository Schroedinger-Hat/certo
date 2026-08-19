/**
 * In-memory event bus provider.
 *
 * Suitable for:
 * - Development
 * - Testing
 * - Single-instance deployments where durability is not required
 *
 * WARNING: Events are lost on process restart. For production distributed
 * deployments or durability requirements, use RedisEventBus instead.
 */

import { DomainEvent, EventBusProvider } from '../event-bus'

export class MemoryEventBus implements EventBusProvider {
  private queue: DomainEvent[] = []
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map()
  private running = false
  private consumerInterval?: NodeJS.Timer

  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler)
  }

  async publish(event: DomainEvent): Promise<void> {
    // Add timestamp if missing
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString()
    }

    // Add unique ID if missing
    if (!event.id) {
      event.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Enqueue for processing
    this.queue.push(event)
  }

  async startConsumer(): Promise<void> {
    if (this.running) return

    this.running = true

    // Process queue every 100ms (or immediately for testing)
    this.consumerInterval = setInterval(async () => {
      while (this.queue.length > 0) {
        const event = this.queue.shift()!
        await this.processEvent(event)
      }
    }, 100)
  }

  async stopConsumer(): Promise<void> {
    if (this.consumerInterval) {
      clearInterval(this.consumerInterval as NodeJS.Timeout)
    }
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  private async processEvent(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.event) || []

    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (error) {
        // Log but don't fail - one handler's error shouldn't affect others
        console.error(`[event-bus] handler failed for ${event.event}:`, error)

        // Retry logic: re-queue with exponential backoff
        const retries = (event.retries || 0) + 1
        if (retries < 3) {
          event.retries = retries
          // Wait before retry: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries - 1) * 1000))
          this.queue.push(event)
        }
      }
    }
  }
}
