import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: any) => fn)
import routeGuard from '../route-guard'

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

function createMockTo(path: string) {
  return { path }
}

describe('route-guard middleware', () => {
  let useAuthStoreMock: any
  let originalProcessServer: any

  beforeEach(() => {
    mockNavigateTo.mockClear()
    useAuthStoreMock = vi.fn()
    vi.doMock('~/stores/auth', () => ({
      useAuthStore: useAuthStoreMock
    }))
    // Mock process.server to false
    originalProcessServer = globalThis.process?.server
    // @ts-ignore
    globalThis.process = { ...(globalThis.process || {}), server: false }
  })

  afterEach(() => {
    // Restore process.server
    if (originalProcessServer === undefined) {
      // @ts-ignore
      delete globalThis.process.server
    } else {
      // @ts-ignore
      globalThis.process.server = originalProcessServer
    }
  })

  it('allows access to public route', () => {
    useAuthStoreMock.mockReturnValue({ isAuthenticated: false })
    routeGuard(createMockTo('/about'))
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
}) 