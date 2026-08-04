import { requestContextStorage, getRequestId } from '../request-context'

describe('request-context', () => {
  it('returns undefined outside any run() context', () => {
    expect(getRequestId()).toBeUndefined()
  })

  it('returns the requestId inside a run() context', async () => {
    await requestContextStorage.run({ requestId: 'abc-123' }, async () => {
      expect(getRequestId()).toBe('abc-123')
    })
  })

  it('is undefined again after the run() context ends', async () => {
    await requestContextStorage.run({ requestId: 'abc-123' }, async () => {})
    expect(getRequestId()).toBeUndefined()
  })

  it('isolates concurrent/overlapping contexts from each other', async () => {
    const seenInsideA: (string | undefined)[] = []
    const seenInsideB: (string | undefined)[] = []

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await Promise.all([
      requestContextStorage.run({ requestId: 'request-a' }, async () => {
        seenInsideA.push(getRequestId())
        await delay(10)
        seenInsideA.push(getRequestId())
      }),
      requestContextStorage.run({ requestId: 'request-b' }, async () => {
        seenInsideB.push(getRequestId())
        await delay(5)
        seenInsideB.push(getRequestId())
      }),
    ])

    expect(seenInsideA).toEqual(['request-a', 'request-a'])
    expect(seenInsideB).toEqual(['request-b', 'request-b'])
  })
})
