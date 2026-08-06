import dashboardFactory from '../dashboard'

/** Minimal strapi stub that satisfies the dashboard service's queries */
function createFakeStrapi({
  credentials = [] as any[],
  achievements = [] as any[],
  user = { createdAt: '2024-01-15T00:00:00.000Z' } as any,
} = {}) {
  const strapi = {
    db: {
      query: (contentType: string) => ({
        count: async ({ where }: any) => {
          if (contentType === 'api::credential.credential') {
            return credentials.filter((c) => {
              if (where.issuer !== undefined && c.issuer !== where.issuer) return false
              if (where.recipient !== undefined && c.recipient !== where.recipient) return false
              if (where.revoked !== undefined && c.revoked !== where.revoked) return false
              if (where.expirationDate?.$lt) {
                if (!c.expirationDate) return false
                if (new Date(c.expirationDate) >= new Date(where.expirationDate.$lt)) return false
              }
              return true
            }).length
          }
          if (contentType === 'api::achievement.achievement') {
            return achievements.filter((a) => a.creator === where.creator).length
          }
          throw new Error(`Unexpected count: ${contentType}`)
        },
        findMany: async ({ where, populate }: any) => {
          if (contentType === 'api::credential.credential') {
            return credentials
              .filter((c) => c.issuer === where.issuer)
              .map((c) => ({
                id: c.id,
                recipient: populate?.recipient ? (c.recipient ? { id: c.recipient } : null) : undefined,
                achievement: populate?.achievement ? (c.achievement ? { id: c.achievement, achievementName: c.achievementName } : null) : undefined,
              }))
          }
          throw new Error(`Unexpected findMany: ${contentType}`)
        },
        findOne: async ({ where }: any) => {
          if (contentType === 'plugin::users-permissions.user') {
            return where.id === user?.id ? user : null
          }
          throw new Error(`Unexpected findOne: ${contentType}`)
        },
      }),
    },
  }
  return strapi
}

describe('dashboard service', () => {
  const PROFILE_ID = 10
  const USER_ID = 1

  it('returns zeros when there are no credentials or achievements', async () => {
    const strapi = createFakeStrapi({ user: { id: USER_ID, createdAt: '2024-01-01T00:00:00.000Z' } })
    const svc = dashboardFactory({ strapi })
    const stats = await svc.getStats(USER_ID, PROFILE_ID)
    expect(stats.credentialsIssued).toBe(0)
    expect(stats.credentialsRevoked).toBe(0)
    expect(stats.credentialsExpired).toBe(0)
    expect(stats.credentialsReceived).toBe(0)
    expect(stats.achievementsCreated).toBe(0)
    expect(stats.uniqueRecipients).toBe(0)
    expect(stats.topAchievements).toEqual([])
    expect(stats.memberSince).toBe('2024-01-01T00:00:00.000Z')
  })

  it('counts issued, revoked, and expired credentials correctly', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    const credentials = [
      { id: 1, issuer: PROFILE_ID, revoked: false },
      { id: 2, issuer: PROFILE_ID, revoked: true },
      { id: 3, issuer: PROFILE_ID, revoked: false, expirationDate: past },
      { id: 4, issuer: PROFILE_ID, revoked: false, expirationDate: future },
    ]
    const strapi = createFakeStrapi({ credentials, user: { id: USER_ID, createdAt: '2024-01-01T00:00:00.000Z' } })
    const svc = dashboardFactory({ strapi })
    const stats = await svc.getStats(USER_ID, PROFILE_ID)
    expect(stats.credentialsIssued).toBe(4)
    expect(stats.credentialsRevoked).toBe(1)
    expect(stats.credentialsExpired).toBe(1)
  })

  it('counts unique recipients (deduplicates repeated recipients)', async () => {
    const credentials = [
      { id: 1, issuer: PROFILE_ID, revoked: false, recipient: 20 },
      { id: 2, issuer: PROFILE_ID, revoked: false, recipient: 20 }, // same recipient
      { id: 3, issuer: PROFILE_ID, revoked: false, recipient: 21 },
    ]
    const strapi = createFakeStrapi({ credentials, user: { id: USER_ID, createdAt: '2024-01-01T00:00:00.000Z' } })
    const svc = dashboardFactory({ strapi })
    const stats = await svc.getStats(USER_ID, PROFILE_ID)
    expect(stats.uniqueRecipients).toBe(2)
  })

  it('computes top achievements sorted by credential count', async () => {
    const credentials = [
      { id: 1, issuer: PROFILE_ID, revoked: false, achievement: 100, achievementName: 'Alpha' },
      { id: 2, issuer: PROFILE_ID, revoked: false, achievement: 100, achievementName: 'Alpha' },
      { id: 3, issuer: PROFILE_ID, revoked: false, achievement: 101, achievementName: 'Beta' },
    ]
    const strapi = createFakeStrapi({ credentials, user: { id: USER_ID, createdAt: '2024-01-01T00:00:00.000Z' } })
    const svc = dashboardFactory({ strapi })
    const stats = await svc.getStats(USER_ID, PROFILE_ID)
    expect(stats.topAchievements[0]).toEqual({ id: 100, name: 'Alpha', count: 2 })
    expect(stats.topAchievements[1]).toEqual({ id: 101, name: 'Beta', count: 1 })
  })

  it('caps topAchievements at 5 entries', async () => {
    const credentials = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      issuer: PROFILE_ID,
      revoked: false,
      achievement: 200 + i,
      achievementName: `Ach ${i}`,
    }))
    const strapi = createFakeStrapi({ credentials, user: { id: USER_ID, createdAt: '2024-01-01T00:00:00.000Z' } })
    const svc = dashboardFactory({ strapi })
    const stats = await svc.getStats(USER_ID, PROFILE_ID)
    expect(stats.topAchievements.length).toBeLessThanOrEqual(5)
  })
})
