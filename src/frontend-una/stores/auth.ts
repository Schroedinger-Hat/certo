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
}

// Flag to prevent multiple initializations
let isInitialized = false

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  // Initialize auth state from localStorage/cookies
  async function init() {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('Auth store already initialized, skipping')
      return
    }
    
    console.log('Initializing auth store')
    isLoading.value = true
    
    try {
      // Check if running in browser
      if (process.client) {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
          token.value = savedToken
          console.log('Token found in localStorage:', savedToken.substring(0, 10) + '...')
          
          // Set token in API client
          apiClient.setToken(savedToken)
          
          // Try to get current user
          const currentUser = authClient.getCurrentUser()
          if (currentUser) {
            console.log('User found in localStorage:', currentUser.email)
            user.value = currentUser
            
            // Validate token with a test request
            try {
              await apiClient.get('/api/profiles/me')
              console.log('Token verified successfully')
            } catch (validationError) {
              console.error('Token validation failed:', validationError)
              // Token is invalid, logout
              logout()
            }
          }
        } else {
          console.log('No token found in localStorage')
        }
      } else {
        console.log('Running on server side, skipping localStorage checks')
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
      console.log('Attempting login for:', identifier)
      const response = await authClient.login({ identifier, password })
      console.log('Login successful, jwt length:', response.jwt.length)
      
      // Save user data
      user.value = response.user
      token.value = response.jwt
      
      // Store token in localStorage (already done by authClient)
      
      // Set token in cookie for server-side auth checks
      if (process.client) {
        Cookies.set('token', response.jwt, { 
          expires: 7,
          path: '/',
          sameSite: 'strict'
        })
      }
      
      // Log the token for debugging
      console.log('Token saved (first 20 chars):', response.jwt.substring(0, 20))
      console.log('User data:', response.user)
      
      // Make sure token is set in API client (already done by authClient)
      
      // Test token is working
      try {
        const debugResponse = await apiClient.debugAuth()
        console.log('Auth debug response:', debugResponse)
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
      console.log('Attempting registration for:', email)
      const response = await authClient.register({ username, email, password })
      console.log('Registration successful')
      
      // Save user data
      user.value = response.user
      token.value = response.jwt
      
      // Store token in localStorage (already done by authClient)
      
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
    console.log('Logging out user')
    
    if (process.client) {
      // Clear auth client state
      authClient.logout()
      
      // Clear cookies
      Cookies.remove('token')
    }
    
    // Clear state
    user.value = null
    token.value = null
  }
  
  // Do NOT initialize on store creation
  // This will be done explicitly in plugins or components
  
  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    init
  }
}) 