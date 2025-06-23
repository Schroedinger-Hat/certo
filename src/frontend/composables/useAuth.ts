import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

interface AuthState {
  token: string | null
  user: any | null
  isAuthenticated: boolean
}

const state = ref<AuthState>({
  token: null,
  user: null,
  isAuthenticated: false
})

export function useAuth() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  console.log('API URL:', apiUrl)

  async function login(identifier: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${apiUrl}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const data = await response.json()
      state.value.token = data.jwt
      state.value.user = data.user
      state.value.isAuthenticated = true

      // Store token in localStorage for persistence
      localStorage.setItem('auth_token', data.jwt)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  function logout(): void {
    state.value.token = null
    state.value.user = null
    state.value.isAuthenticated = false
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  async function getToken(): Promise<string | null> {
    // First check state
    if (state.value.token) {
      return state.value.token
    }

    // Then check localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      state.value.token = token
      state.value.isAuthenticated = true
      const user = localStorage.getItem('auth_user')
      if (user) {
        state.value.user = JSON.parse(user)
      }
      return token
    }

    return null
  }

  async function checkAuth(): Promise<boolean> {
    const token = await getToken()
    return !!token
  }

  return {
    login,
    logout,
    getToken,
    checkAuth,
    isAuthenticated: () => state.value.isAuthenticated,
    getUser: () => state.value.user,
  }
} 