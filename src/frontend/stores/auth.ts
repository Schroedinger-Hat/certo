import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import { authClient } from '~/api/auth-client'
import { apiClient } from '~/api/api-client'

interface User {
  id: number
  username: string
  email: string
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
  role?: {
    name: string
  }
}

interface Profile {
  id: number
  name: string
  email: string
  profileType: 'Issuer' | 'Recipient' | null
}

interface ProfileResponse {
  data: Profile | Profile[]
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

// Flag to prevent multiple initializations
let isInitialized = false

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isIssuer = computed(() => (userRole.value && userRole.value.toLowerCase() === 'issuer'))
  const userRole = computed(() => user.value?.role?.name || null)
  
  // Initialize auth state from localStorage/cookies
  async function init() {
    // Prevent multiple initializations
    if (isInitialized) {
      return
    }
    
    isLoading.value = true
    
    try {
      // Check if running in browser
      if (process.client) {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
          token.value = savedToken
          
          // Set token in API client
          apiClient.setToken(savedToken)
          
          // Try to get current user
          const currentUser = authClient.getCurrentUser()
          if (currentUser) {
            user.value = currentUser
            
            // Validate token and get profile
            try {
              const profileResponse = await apiClient.get<ProfileResponse>('/api/profiles/me')
              if (profileResponse.data) {
                profile.value = Array.isArray(profileResponse.data) 
                  ? profileResponse.data[0] 
                  : profileResponse.data
              }
            } catch (validationError) {
              console.error('Token validation failed:', validationError)
              // Token is invalid, logout
              logout()
            }
          }
        }
      }

      // Mark as initialized
      isInitialized = true
    } catch (e) {
      console.error('Error initializing auth store:', e)
    } finally {
      isLoading.value = false
    }
  }
  
  async function login(identifier: string, password: string) {
    error.value = null
    isLoading.value = true
    
    try {
      const response = await authClient.login({ identifier, password })
      
      // Save user data
      user.value = response.user
      token.value = response.jwt
      
      // Fetch full user with role using /api/users/me?populate=*
      try {
        const fullUser = await apiClient.get<User>('/api/users/me', { populate: '*' })
        if (fullUser) {
          user.value = fullUser
        }
      } catch (userError) {
        console.error('Error loading full user:', userError)
      }
      
      // Get user profile
      try {
        const profileResponse = await apiClient.get<ProfileResponse>('/api/profiles/me')
        if (profileResponse.data) {
          profile.value = Array.isArray(profileResponse.data) 
            ? profileResponse.data[0] 
            : profileResponse.data
        }
      } catch (profileError) {
        console.error('Error loading profile:', profileError)
      }
      
      // Set token in cookie for server-side auth checks
      if (process.client) {
        Cookies.set('token', response.jwt, { 
          expires: 7,
          path: '/',
          sameSite: 'strict'
        })
      }
      
      // Test token is working
      try {
        const debugResponse = await apiClient.debugAuth()
      } catch (authErr) {
        console.error('Auth debug test failed:', authErr)
      }
      
      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  async function register(username: string, email: string, password: string) {
    error.value = null
    isLoading.value = true
    
    try {
      const response = await authClient.register({ username, email, password })
      
      // Save user data
      user.value = response.user
      token.value = response.jwt
      
      // Fetch full user with role using /api/users/me?populate=*
      try {
        const fullUser = await apiClient.get<User>('/api/users/me', { populate: '*' })
        if (fullUser) {
          user.value = fullUser
        }
      } catch (userError) {
        console.error('Error loading full user:', userError)
      }
      
      // Get user profile
      try {
        const profileResponse = await apiClient.get<ProfileResponse>('/api/profiles/me')
        if (profileResponse.data) {
          profile.value = Array.isArray(profileResponse.data) 
            ? profileResponse.data[0] 
            : profileResponse.data
        }
      } catch (profileError) {
        console.error('Error loading profile:', profileError)
      }
      
      // Set token in cookie for server-side auth checks
      if (process.client) {
        Cookies.set('token', response.jwt, { expires: 7 })
      }
      
      return true
    } catch (err) {
      console.error('Registration error:', err)
      error.value = err instanceof Error ? err.message : 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  function logout() {
    if (process.client) {
      // Clear auth client state
      authClient.logout()
      
      // Clear cookies
      Cookies.remove('token')
    }
    
    // Clear state
    user.value = null
    token.value = null
    profile.value = null
  }
  
  return {
    user,
    token,
    profile,
    isLoading,
    error,
    isAuthenticated,
    isIssuer,
    userRole,
    login,
    register,
    logout,
    init
  }
}) 