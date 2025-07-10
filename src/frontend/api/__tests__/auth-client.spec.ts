import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockApiClient = {
  post: vi.fn(),
  get: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  baseUrl: 'http://test.local'
}

globalThis.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  clear: vi.fn(),
  key: vi.fn()
} as Storage

describe('authClient', () => {
  let AuthClient: typeof import('../auth-client').AuthClient
  let authClient: InstanceType<typeof import('../auth-client').AuthClient>
  let originalProcessClient: boolean | undefined

  beforeEach(async () => {
    vi.resetAllMocks()
    // Mock process.client to true
    originalProcessClient = import.meta.client
    globalThis.process = { ...(globalThis.process || {}), client: true }
    vi.doMock('../api-client', () => ({ apiClient: mockApiClient }))
    vi.doMock('./api-client', () => ({ apiClient: mockApiClient }))
    // Import AuthClient after mocks
    AuthClient = (await import('../auth-client')).AuthClient
    authClient = new AuthClient()
    mockApiClient.baseUrl = 'http://test.local'
  })

  afterEach(() => {
    vi.resetModules()
    // Restore process.client
    if (originalProcessClient === undefined) {
      // @ts-expect-error We expect an error here
      delete import.meta.client
    }
    else {
      globalThis.process = { ...(globalThis.process || {}), client: originalProcessClient }
    }
  })

  it('login sets token and user on success', async () => {
    mockApiClient.post.mockResolvedValue({ jwt: 'token', user: { id: 1, email: 'test@test.com' } })
    mockApiClient.get.mockResolvedValue({ id: 1, email: 'test@test.com', role: { id: 1, name: 'Issuer' } })
    const data = { identifier: 'test', password: 'pw' }
    await authClient.login(data)
    expect(mockApiClient.setToken).toHaveBeenCalledWith('token')
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'token')
    expect(localStorage.setItem).toHaveBeenCalledWith('user', expect.any(String))
  })

  it('register sets token and user on success', async () => {
    mockApiClient.post.mockResolvedValue({ jwt: 'token', user: { id: 2, email: 'reg@test.com' } })
    mockApiClient.get.mockResolvedValue({ id: 2, email: 'reg@test.com', role: { id: 2, name: 'Recipient' } })
    const data = { username: 'reg', email: 'reg@test.com', password: 'pw' }
    await authClient.register(data)
    expect(mockApiClient.setToken).toHaveBeenCalledWith('token')
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'token')
    expect(localStorage.setItem).toHaveBeenCalledWith('user', expect.any(String))
  })

  it('logout clears token and user', () => {
    authClient.logout()
    expect(mockApiClient.clearToken).toHaveBeenCalled()
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('isAuthenticated returns true if token and user exist', () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>) = vi.fn(key => (key === 'token' ? 'token' : key === 'user' ? '{}' : null))
    expect(authClient.isAuthenticated()).toBe(true)
  })

  it('isAuthenticated returns false if token or user missing', () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>) = vi.fn(() => null)
    expect(authClient.isAuthenticated()).toBe(false)
  })
})
