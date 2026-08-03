import { revocationListExtension } from '../revocation-list'

function createFakeStrapi() {
  const profiles = new Map<number, any>([[1, { id: 1, name: 'Test Issuer' }]])
  const lists = new Map<number, any>()
  let nextId = 1

  return {
    strapi: {
      entityService: {
        findOne: async (contentType: string, id: number) => {
          if (contentType === 'api::profile.profile') return profiles.get(id) || null
          if (contentType === 'api::revocation-list.revocation-list') return lists.get(id) || null
          throw new Error(`Unexpected content type: ${contentType}`)
        },
        findMany: async (contentType: string, { filters }: any) => {
          if (contentType !== 'api::revocation-list.revocation-list') throw new Error('unexpected content type')
          return [...lists.values()].filter(
            (list) => list.issuer === filters.issuer?.id && list.statusPurpose === filters.statusPurpose
          )
        },
        create: async (contentType: string, { data }: any) => {
          if (contentType !== 'api::revocation-list.revocation-list') throw new Error('unexpected content type')
          const record = { id: nextId++, ...data }
          lists.set(record.id, record)
          return record
        },
        update: async (contentType: string, id: number, { data }: any) => {
          if (contentType !== 'api::revocation-list.revocation-list') throw new Error('unexpected content type')
          const updated = { ...lists.get(id), ...data }
          lists.set(id, updated)
          return updated
        },
      },
    },
    lists,
  }
}

describe('revocation-list service', () => {
  it('creates an empty status list for an issuer', async () => {
    const { strapi } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)

    const list = await service.createStatusListCredential(1)

    expect(list.issuer).toBe(1)
    expect(list.nextIndex).toBe(0)
    expect(list.statusListCredential).toMatch(/^urn:uuid:/)
  })

  it('getOrCreateActiveListForIssuer reuses an existing list', async () => {
    const { strapi, lists } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)

    const first = await service.getOrCreateActiveListForIssuer(1)
    const second = await service.getOrCreateActiveListForIssuer(1)

    expect(second.id).toBe(first.id)
    expect(lists.size).toBe(1)
  })

  it('assignNextIndex hands out sequential, non-repeating indices', async () => {
    const { strapi } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)
    const list = await service.createStatusListCredential(1)

    const first = await service.assignNextIndex(list.id)
    const second = await service.assignNextIndex(list.id)

    expect(first).toBe(0)
    expect(second).toBe(1)
  })

  it('checkStatusInList is false for an empty list', async () => {
    const { strapi } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)
    const list = await service.createStatusListCredential(1)

    expect(await service.checkStatusInList(list, 0)).toBe(false)
  })

  it('revokeCredentialInStatusList flips the bit, checkStatusInList sees it', async () => {
    const { strapi } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)
    const list = await service.createStatusListCredential(1)
    const index = await service.assignNextIndex(list.id)

    await service.revokeCredentialInStatusList(list.id, index)
    const updatedList = await strapi.entityService.findOne('api::revocation-list.revocation-list', list.id)

    expect(await service.checkStatusInList(updatedList, index)).toBe(true)
    expect(await service.checkStatusInList(updatedList, index + 1)).toBe(false)
  })

  it('revokeCredentialInStatusList is idempotent (revoking twice keeps one entry)', async () => {
    const { strapi } = createFakeStrapi()
    const service = revocationListExtension({ strapi } as any)
    const list = await service.createStatusListCredential(1)

    await service.revokeCredentialInStatusList(list.id, 5)
    await service.revokeCredentialInStatusList(list.id, 5)
    const updatedList = await strapi.entityService.findOne('api::revocation-list.revocation-list', list.id)

    expect(updatedList.encodedList).toBe('5')
  })
})
