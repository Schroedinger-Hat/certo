import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import routeGuard from '../route-guard'

vi.stubGlobal('defineNuxtRouteMiddleware', (fn: (...args: any[]) => any) => fn)

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

function createMockTo(path: string) {
  return {
    path,
    name: undefined,
    params: {},
    query: {},
    hash: '',
    fullPath: path,
    matched: [],
    meta: {},
    redirectedFrom: undefined
  }
}

describe('route-guard middleware', () => {
  let useAuthStoreMock: ReturnType<typeof vi.fn>
  let originalProcessServer: boolean | undefined

  beforeEach(() => {
    mockNavigateTo.mockClear()
    useAuthStoreMock = vi.fn()
    vi.doMock('~/stores/auth', () => ({
      useAuthStore: useAuthStoreMock
    }))
    // Mock process.server to false
    originalProcessServer = import.meta.server
    globalThis.process = { ...(globalThis.process || {}), server: false }
  })

  afterEach(() => {
    // Restore process.server
    if (originalProcessServer === undefined) {
      // @ts-expect-error Expect error here
      delete import.meta.server
    }
    else {
      globalThis.process = { ...(globalThis.process || {}), server: originalProcessServer }
    }
  })

  it('allows access to public route', () => {
    useAuthStoreMock.mockReturnValue({ isAuthenticated: false })
    routeGuard(createMockTo('/about'), createMockTo('/dashboard'))
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
