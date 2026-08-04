import dataPortabilityFactory from '../data-portability'

function createFakeStrapi() {
  const achievements: any[] = []
  const credentials: any[] = []
  const evidence: any[] = []
  let nextId = 1

  const strapi = {
    entityService: {
      findMany: async (contentType: string, { filters }: any) => {
        if (contentType === 'api::achievement.achievement') {
          return achievements.filter((a) => a.creator === filters.creator)
        }
        if (contentType === 'api::credential.credential') {
          if ('issuer' in filters) return credentials.filter((c) => c.issuer === filters.issuer)
          if ('recipient' in filters) return credentials.filter((c) => c.recipientId === filters.recipient)
        }
        throw new Error(`Unexpected findMany content type: ${contentType}`)
      },
      create: async (contentType: string, { data }: any) => {
        const record = { id: nextId++, ...data }
        if (contentType === 'api::achievement.achievement') achievements.push(record)
        else if (contentType === 'api::credential.credential') credentials.push(record)
        else if (contentType === 'api::evidence.evidence') evidence.push(record)
        else throw new Error(`Unexpected create content type: ${contentType}`)
        return record
      },
    },
    db: {
      query: (contentType: string) => ({
        findOne: async ({ where }: any) => {
          if (contentType === 'api::achievement.achievement') {
            return achievements.find((a) => a.achievementId === where.achievementId) || null
          }
          if (contentType === 'api::credential.credential') {
            return credentials.find((c) => c.credentialId === where.credentialId) || null
          }
          if (contentType === 'api::evidence.evidence') {
            return evidence.find((e) => e.evidenceId === where.evidenceId) || null
          }
          throw new Error(`Unexpected query content type: ${contentType}`)
        },
      }),
    },
    service: (uid: string) => {
      if (uid !== 'api::credential.credential') throw new Error(`Unexpected service: ${uid}`)
      return {
        findOrCreateRecipientProfile: async (recipient: any) => {
          if (recipient.id) return { id: recipient.id }
          return { id: 999, email: recipient.email }
        },
      }
    },
  }

  return { strapi, achievements, credentials, evidence }
}

describe('data-portability', () => {
  it('exportProfileData gathers achievements created, credentials issued/received, and evidence from issued credentials', async () => {
    const { strapi, achievements, credentials } = createFakeStrapi()
    achievements.push({ id: 1, creator: 5, achievementId: 'my-badge' })
    credentials.push({ id: 10, issuer: 5, credentialId: 'urn:uuid:issued', evidence: [{ evidenceId: 'ev-1' }] })
    credentials.push({ id: 11, recipientId: 5, credentialId: 'urn:uuid:received' })

    const service = dataPortabilityFactory({ strapi })
    const bundle = await service.exportProfileData({ id: 5 })

    expect(bundle.achievementsCreated).toEqual([{ id: 1, creator: 5, achievementId: 'my-badge' }])
    expect(bundle.credentialsIssued.map((c: any) => c.credentialId)).toEqual(['urn:uuid:issued'])
    expect(bundle.credentialsReceived.map((c: any) => c.credentialId)).toEqual(['urn:uuid:received'])
    expect(bundle.evidence).toEqual([{ evidenceId: 'ev-1' }])
  })

  it('importProfileData creates achievements/credentials/evidence that do not already exist', async () => {
    const { strapi, achievements, credentials, evidence } = createFakeStrapi()
    const service = dataPortabilityFactory({ strapi })

    const bundle = {
      achievementsCreated: [{ achievementId: 'my-badge', name: 'My Badge' }],
      credentialsIssued: [{
        credentialId: 'urn:uuid:issued',
        name: 'A credential',
        achievement: { achievementId: 'my-badge' },
        recipient: { email: 'recipient@example.com', name: 'Recipient' },
        proof: [{ jws: 'abc' }],
        evidence: [{ evidenceId: 'ev-1', name: 'Evidence 1' }],
      }],
      credentialsReceived: [],
    }

    const result = await service.importProfileData({ id: 5 }, bundle)

    expect(result.achievementsImported).toEqual(['my-badge'])
    expect(result.credentialsImported).toEqual(['urn:uuid:issued'])
    expect(achievements).toHaveLength(1)
    expect(achievements[0].creator).toBe(5)
    expect(credentials).toHaveLength(1)
    expect(credentials[0].issuer).toBe(5)
    expect(credentials[0].achievement).toBe(achievements[0].id)
    expect(credentials[0].proof).toEqual([{ jws: 'abc' }])
    expect(evidence).toHaveLength(1)
    expect(evidence[0].credential).toBe(credentials[0].id)
  })

  it('is idempotent - re-importing the same bundle skips everything instead of duplicating', async () => {
    const { strapi, achievements, credentials, evidence } = createFakeStrapi()
    const service = dataPortabilityFactory({ strapi })

    const bundle = {
      achievementsCreated: [{ achievementId: 'my-badge', name: 'My Badge' }],
      credentialsIssued: [{
        credentialId: 'urn:uuid:issued',
        achievement: { achievementId: 'my-badge' },
        recipient: { email: 'recipient@example.com' },
        proof: [{ jws: 'abc' }],
        evidence: [{ evidenceId: 'ev-1' }],
      }],
      credentialsReceived: [],
    }

    await service.importProfileData({ id: 5 }, bundle)
    const second = await service.importProfileData({ id: 5 }, bundle)

    expect(second.achievementsSkipped).toEqual(['my-badge'])
    expect(second.credentialsSkipped).toEqual(['urn:uuid:issued'])
    expect(achievements).toHaveLength(1)
    expect(credentials).toHaveLength(1)
    expect(evidence).toHaveLength(1)
  })

  it('never imports credentialsReceived', async () => {
    const { strapi, achievements, credentials } = createFakeStrapi()
    const service = dataPortabilityFactory({ strapi })

    const bundle = {
      achievementsCreated: [],
      credentialsIssued: [],
      credentialsReceived: [{ credentialId: 'urn:uuid:someone-elses', achievement: {}, recipient: {} }],
    }

    const result = await service.importProfileData({ id: 5 }, bundle)

    expect(result.credentialsImported).toEqual([])
    expect(achievements).toHaveLength(0)
    expect(credentials).toHaveLength(0)
  })
})
