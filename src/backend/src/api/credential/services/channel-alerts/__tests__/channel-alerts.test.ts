/**
 * Tests for Slack, Teams, Discord providers and the channelAlerts dispatcher.
 * Uses real fetch mock to verify correct payload shapes without hitting real webhooks.
 */

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as any

// Helpers
function mockFetchSuccess() {
  mockFetch.mockResolvedValue({ ok: true, status: 200 } as any)
}

function mockFetchFail(status = 500) {
  mockFetch.mockResolvedValue({ ok: false, status } as any)
}

const ISSUED_ALERT = {
  credentialId: 'urn:uuid:abc',
  credentialUrl: 'https://certo.example.com/credentials/urn:uuid:abc',
  achievementName: 'Web Dev Basics',
  recipientEmail: 'alice@example.com',
  issuerName: 'Acme Corp',
}

const REVOKED_ALERT = {
  credentialId: 'urn:uuid:abc',
  recipientEmail: 'alice@example.com',
  reason: 'Employee left',
  revokedBy: 'admin@example.com',
}

const EXPIRATION_ALERT = {
  count: 2,
  items: [
    { credentialId: 'urn:uuid:x1', recipientEmail: 'a@b.com', achievementName: 'Badge A', daysLeft: 7 },
    { credentialId: 'urn:uuid:x2', recipientEmail: 'c@d.com', daysLeft: 1 },
  ],
}

// ── Slack ─────────────────────────────────────────────────────────────────────

describe('Slack provider', () => {
  let createSlackProvider: typeof import('../slack').createSlackProvider

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    ;({ createSlackProvider } = await import('../slack'))
  })

  it('sendCredentialIssued posts Block Kit payload to webhook URL', async () => {
    mockFetchSuccess()
    const provider = createSlackProvider('https://hooks.slack.com/test')
    await provider.sendCredentialIssued(ISSUED_ALERT)
    expect(mockFetch).toHaveBeenCalledWith('https://hooks.slack.com/test', expect.objectContaining({
      method: 'POST',
    }))
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.blocks).toBeDefined()
    expect(JSON.stringify(body)).toContain('Web Dev Basics')
    expect(JSON.stringify(body)).toContain('alice@example.com')
  })

  it('sendCredentialRevoked posts revocation message', async () => {
    mockFetchSuccess()
    const provider = createSlackProvider('https://hooks.slack.com/test')
    await provider.sendCredentialRevoked(REVOKED_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(JSON.stringify(body)).toContain('revoked')
    expect(JSON.stringify(body)).toContain('Employee left')
  })

  it('sendExpirationDigest posts digest message', async () => {
    mockFetchSuccess()
    const provider = createSlackProvider('https://hooks.slack.com/test')
    await provider.sendExpirationDigest(EXPIRATION_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(JSON.stringify(body)).toContain('expiring soon')
  })

  it('throws on HTTP error', async () => {
    mockFetchFail(500)
    const provider = createSlackProvider('https://hooks.slack.com/test')
    await expect(provider.sendCredentialIssued(ISSUED_ALERT)).rejects.toThrow('Slack webhook failed')
  })
})

// ── Teams ─────────────────────────────────────────────────────────────────────

describe('Teams provider', () => {
  let createTeamsProvider: typeof import('../teams').createTeamsProvider

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    ;({ createTeamsProvider } = await import('../teams'))
  })

  it('sendCredentialIssued posts Adaptive Card payload', async () => {
    mockFetchSuccess()
    const provider = createTeamsProvider('https://teams.webhook.example.com/test')
    await provider.sendCredentialIssued(ISSUED_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.type).toBe('message')
    expect(JSON.stringify(body)).toContain('AdaptiveCard')
    expect(JSON.stringify(body)).toContain('Web Dev Basics')
  })

  it('sendCredentialRevoked posts red attention card', async () => {
    mockFetchSuccess()
    const provider = createTeamsProvider('https://teams.webhook.example.com/test')
    await provider.sendCredentialRevoked(REVOKED_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(JSON.stringify(body)).toContain('revoked')
  })
})

// ── Discord ───────────────────────────────────────────────────────────────────

describe('Discord provider', () => {
  let createDiscordProvider: typeof import('../discord').createDiscordProvider

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    ;({ createDiscordProvider } = await import('../discord'))
  })

  it('sendCredentialIssued posts green embed', async () => {
    mockFetchSuccess()
    const provider = createDiscordProvider('https://discord.com/api/webhooks/test')
    await provider.sendCredentialIssued(ISSUED_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.embeds).toBeDefined()
    expect(body.embeds[0].color).toBe(0x48bb78)
    expect(JSON.stringify(body)).toContain('Web Dev Basics')
  })

  it('sendExpirationDigest posts orange embed', async () => {
    mockFetchSuccess()
    const provider = createDiscordProvider('https://discord.com/api/webhooks/test')
    await provider.sendExpirationDigest(EXPIRATION_ALERT)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.embeds[0].color).toBe(0xed8936)
  })
})

// ── channelAlerts dispatcher ──────────────────────────────────────────────────

describe('channelAlerts dispatcher', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    Object.assign(process.env, originalEnv)
    delete process.env['SLACK_WEBHOOK_URL']
    delete process.env['TEAMS_WEBHOOK_URL']
    delete process.env['DISCORD_WEBHOOK_URL']
    mockFetch.mockReset()
    jest.resetModules()
  })

  it('sends to all configured providers in parallel', async () => {
    mockFetch.mockReset()
    mockFetchSuccess()
    process.env['SLACK_WEBHOOK_URL'] = 'https://hooks.slack.com/x'
    process.env['DISCORD_WEBHOOK_URL'] = 'https://discord.com/api/webhooks/y'

    const { channelAlerts } = await import('../index')
    await channelAlerts.sendCredentialIssued(ISSUED_ALERT)

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('does nothing when no providers configured', async () => {
    process.env['SLACK_WEBHOOK_URL'] = ''
    process.env['TEAMS_WEBHOOK_URL'] = ''
    process.env['DISCORD_WEBHOOK_URL'] = ''

    const { channelAlerts } = await import('../index')
    await channelAlerts.sendCredentialIssued(ISSUED_ALERT)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('swallows individual provider failures without throwing', async () => {
    mockFetchFail(500)
    process.env['SLACK_WEBHOOK_URL'] = 'https://hooks.slack.com/x'

    const { channelAlerts } = await import('../index')
    // Should not throw even though fetch fails
    await expect(channelAlerts.sendCredentialIssued(ISSUED_ALERT)).resolves.not.toThrow()
  })
})
