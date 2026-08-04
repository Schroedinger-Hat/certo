import auditLogFactory from '../audit-log'

function createFakeStrapi() {
  const entries: any[] = []
  return {
    strapi: {
      entityService: {
        create: async (contentType: string, { data }: any) => {
          if (contentType !== 'api::audit-log-entry.audit-log-entry') {
            throw new Error(`Unexpected content type: ${contentType}`)
          }
          const record = { id: entries.length + 1, ...data }
          entries.push(record)
          return record
        },
      },
    },
    entries,
  }
}

describe('audit-log service', () => {
  it('records an action with a known actor', async () => {
    const { strapi, entries } = createFakeStrapi()
    const service = auditLogFactory({ strapi } as any)

    await service.record({
      action: 'credential.issue',
      entityType: 'credential',
      entityId: 42,
      actorId: 7,
      metadata: { achievementId: 3 },
    })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      action: 'credential.issue',
      entityType: 'credential',
      entityId: '42', // coerced to string
      actorId: 7,
      actorType: 'user',
      metadata: { achievementId: 3 },
    })
  })

  it('defaults actorType to system when no actor is given', async () => {
    const { strapi, entries } = createFakeStrapi()
    const service = auditLogFactory({ strapi } as any)

    await service.record({ action: 'credential.revoke', entityType: 'credential', entityId: 'urn:uuid:abc' })

    expect(entries[0].actorId).toBeNull()
    expect(entries[0].actorType).toBe('system')
    expect(entries[0].metadata).toEqual({})
  })
})
