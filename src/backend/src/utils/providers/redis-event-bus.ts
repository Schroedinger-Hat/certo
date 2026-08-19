/**
 * Redis Streams-based event bus provider.
 *
 * Suitable for:
 * - Production deployments
 * - Distributed systems
 * - High-volume event processing
 * - Durability and replay requirements
 *
 * Uses Redis Streams (XADD, XREAD, XACK) for reliable event publishing.
 *
 * Prerequisites:
 *   npm install ioredis
 *
 * Environment variables:
 *   EVENT_BUS_REDIS_HOST=redis
 *   EVENT_BUS_REDIS_PORT=6379
 *   EVENT_BUS_REDIS_PASSWORD=...
 *   EVENT_BUS_REDIS_DB=0
 */

import { DomainEvent, EventBusProvider } from '../event-bus'

export class RedisEventBus implements EventBusProvider {
  private redis: any
  private consumerGroup = 'certo-event-consumer'
  private consumerName = `consumer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  private running = false
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map()

  constructor(config: any = {}) {
    this.initializeRedis(config)
  }

  private initializeRedis(config: any): void {
    try {
      // Lazy-load ioredis to avoid requiring it if not using Redis
      const Redis = require('ioredis')

      this.redis = new Redis({
        host: config.host || process.env.EVENT_BUS_REDIS_HOST || 'localhost',
        port: config.port || parseInt(process.env.EVENT_BUS_REDIS_PORT || '6379'),
        password: config.password || process.env.EVENT_BUS_REDIS_PASSWORD,
        db: config.db || parseInt(process.env.EVENT_BUS_REDIS_DB || '0'),
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        enableOfflineQueue: true,
      })

      this.redis.on('error', (err: any) => {
        console.error('[event-bus-redis] connection error:', err)
      })
    } catch (error) {
      throw new Error(
        'RedisEventBus requires ioredis. Install with: npm install ioredis'
      )
    }
  }

  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler)
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString()
    }

    if (!event.id) {
      event.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Add to Redis Stream (one stream per event type for easier filtering)
    const streamKey = `event:${event.event}`
    const payload = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      data: event.data,
      retries: event.retries || 0,
    })

    try {
      await this.redis.xadd(streamKey, '*', 'payload', payload)
    } catch (error) {
      console.error(`[event-bus-redis] failed to publish ${event.event}:`, error)
      throw error
    }
  }

  async startConsumer(): Promise<void> {
    if (this.running) return
    this.running = true

    // Create consumer group if it doesn't exist
    for (const eventName of this.handlers.keys()) {
      const streamKey = `event:${eventName}`
      try {
        await this.redis.xgroup('CREATE', streamKey, this.consumerGroup, '0', 'MKSTREAM')
      } catch (error: any) {
        // Group already exists, that's OK
        if (!error.message?.includes('BUSYGROUP')) {
          console.error(`[event-bus-redis] failed to create consumer group:`, error)
        }
      }
    }

    // Start consuming in a loop
    this.consumeLoop()
  }

  async stopConsumer(): Promise<void> {
    this.running = false
    if (this.redis) {
      await this.redis.disconnect()
    }
  }

  isRunning(): boolean {
    return this.running
  }

  private async consumeLoop(): Promise<void> {
    while (this.running) {
      try {
        const streams = Array.from(this.handlers.keys()).map(
          (eventName) => `event:${eventName}`
        )

        if (streams.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        // Build XREADGROUP args: ['GROUP', group, consumer, 'COUNT', 10, 'STREAMS', ...streams, '>', '>']
        const args = [
          'GROUP',
          this.consumerGroup,
          this.consumerName,
          'COUNT',
          10,
          'BLOCK',
          5000, // 5 second block to avoid busy-waiting
          'STREAMS',
          ...streams,
          ...Array(streams.length).fill('>'), // '>' means undelivered messages
        ]

        const messages = await this.redis.xreadgroup(...args)

        if (!messages) continue

        for (const [streamKey, events] of messages) {
          const eventName = streamKey.replace('event:', '')
          const handlers = this.handlers.get(eventName) || []

          for (const [messageId, fields] of events) {
            const payload = fields[fields.indexOf('payload') + 1]
            const event = JSON.parse(payload) as DomainEvent
            event.event = eventName

            let lastError: any
            for (const handler of handlers) {
              try {
                await handler(event)
              } catch (error) {
                lastError = error
                console.error(
                  `[event-bus-redis] handler failed for ${eventName}:`,
                  error
                )
              }
            }

            // ACK the message (mark as processed)
            if (!lastError) {
              try {
                await this.redis.xack(streamKey, this.consumerGroup, messageId)
              } catch (error) {
                console.error(`[event-bus-redis] failed to ack message:`, error)
              }
            } else {
              // Retry logic: if failed, increment retries and check if we should retry
              const retries = (event.retries || 0) + 1
              if (retries < 3) {
                // Re-add to stream for retry (without ACK, it stays in pending)
                event.retries = retries
                await this.redis.xadd(
                  streamKey,
                  '*',
                  'payload',
                  JSON.stringify(event)
                )
              } else {
                // Too many retries, give up and ACK to remove from queue
                await this.redis.xack(streamKey, this.consumerGroup, messageId)
                console.error(
                  `[event-bus-redis] event ${event.id} failed after 3 retries`
                )
              }
            }
          }
        }
      } catch (error) {
        console.error('[event-bus-redis] consumer loop error:', error)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Backoff
      }
    }
  }
}
