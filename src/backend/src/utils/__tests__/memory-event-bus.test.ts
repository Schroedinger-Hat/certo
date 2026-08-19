import { MemoryEventBus } from '../providers/memory-event-bus'

describe('MemoryEventBus', () => {
  let eventBus: MemoryEventBus

  beforeEach(() => {
    eventBus = new MemoryEventBus()
  })

  afterEach(async () => {
    await eventBus.stopConsumer()
  })

  it('should publish and consume events', async () => {
    const events: any[] = []

    eventBus.subscribe('test.event', async (event) => {
      events.push(event)
    })

    await eventBus.startConsumer()

    // Publish event
    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: { foo: 'bar' },
    })

    // Wait for event to be processed
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('test.event')
    expect(events[0].data).toEqual({ foo: 'bar' })
  })

  it('should assign unique IDs to events', async () => {
    const events: any[] = []

    eventBus.subscribe('test.event', async (event) => {
      events.push(event)
    })

    await eventBus.startConsumer()

    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: {},
    })

    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: {},
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(events[0].id).toBeDefined()
    expect(events[1].id).toBeDefined()
    expect(events[0].id).not.toBe(events[1].id)
  })

  it('should support multiple subscribers for the same event', async () => {
    const handler1Events: any[] = []
    const handler2Events: any[] = []

    eventBus.subscribe('test.event', async (event) => {
      handler1Events.push(event)
    })

    eventBus.subscribe('test.event', async (event) => {
      handler2Events.push(event)
    })

    await eventBus.startConsumer()

    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: { msg: 'hello' },
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(handler1Events).toHaveLength(1)
    expect(handler2Events).toHaveLength(1)
    expect(handler1Events[0].data).toEqual({ msg: 'hello' })
    expect(handler2Events[0].data).toEqual({ msg: 'hello' })
  })

  it('should handle handler errors and retry', async () => {
    const successes: any[] = []
    let attempts = 0

    eventBus.subscribe('test.event', async (event) => {
      attempts++
      if (attempts < 3) {
        throw new Error('Temporary failure')
      }
      successes.push(event)
    })

    await eventBus.startConsumer()

    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: { test: 'retry' },
    })

    // Wait for retries (1s, 2s delays)
    await new Promise(resolve => setTimeout(resolve, 3500))

    expect(attempts).toBe(3)
    expect(successes).toHaveLength(1)
  }, 10000) // Increase timeout for retry delays

  it('should give up after 3 retries', async () => {
    let attempts = 0

    eventBus.subscribe('test.event', async (event) => {
      attempts++
      throw new Error('Persistent failure')
    })

    await eventBus.startConsumer()

    await eventBus.publish({
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: {},
    })

    // Wait for all retries (1s, 2s, 4s)
    await new Promise(resolve => setTimeout(resolve, 7500))

    expect(attempts).toBe(3)
  }, 10000) // Increase timeout to 10 seconds for retry delays

  it('should only deliver events to subscribed handlers', async () => {
    const event1Received: any[] = []
    const event2Received: any[] = []

    eventBus.subscribe('event.one', async (event) => {
      event1Received.push(event)
    })

    eventBus.subscribe('event.two', async (event) => {
      event2Received.push(event)
    })

    await eventBus.startConsumer()

    await eventBus.publish({
      event: 'event.one',
      timestamp: new Date().toISOString(),
      data: { type: 'one' },
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(event1Received).toHaveLength(1)
    expect(event2Received).toHaveLength(0)
  })

  it('isRunning should return correct state', async () => {
    expect(eventBus.isRunning()).toBe(false)

    await eventBus.startConsumer()
    expect(eventBus.isRunning()).toBe(true)

    await eventBus.stopConsumer()
    expect(eventBus.isRunning()).toBe(false)
  })
})
