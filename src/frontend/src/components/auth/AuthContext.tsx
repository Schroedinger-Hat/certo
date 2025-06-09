'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authClient } from '@/api/auth-client'
import { apiClient } from '@/api/api-client'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Checking auth with token:', token ? `${token.substring(0, 10)}...` : 'none')
        
        const currentUser = authClient.getCurrentUser()
        if (currentUser && token) {
          console.log('Found user in localStorage:', currentUser.username)
          
          // Set the token in the API client
          apiClient.setToken(token)
          
          // Make a test request to verify token is valid
          try {
            await apiClient.get('/api/profiles/me')
            console.log('Token verified successfully')
            setUser(currentUser)
          } catch (error) {
            console.error('Token validation failed:', error)
            // Token is invalid, logout
            handleLogout()
          }
        } else {
          console.log('No user session found')
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (identifier: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      console.log('Attempting login for:', identifier)
      const response = await authClient.login({ identifier, password })
      console.log('Login successful, jwt length:', response.jwt.length)
      
      // Save user data
      setUser(response.user)
      
      // Store token in localStorage
      localStorage.setItem('token', response.jwt)
      
      // Set token in cookie for server-side auth checks
      Cookies.set('token', response.jwt, { 
        expires: 7,
        path: '/',
        sameSite: 'strict'
      })
      
      // Log the token for debugging
      console.log('Token saved (first 20 chars):', response.jwt.substring(0, 20))
      console.log('User data:', response.user)
      
      // Make sure token is set in API client
      apiClient.setToken(response.jwt)
      
      // Test token is working
      try {
        const debugResponse = await apiClient.debugAuth()
        console.log('Auth debug response:', debugResponse)
      } catch (authErr) {
        console.error('Auth debug test failed:', authErr)
      }
      
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      console.log('Attempting registration for:', email)
      const response = await authClient.register({ username, email, password })
      console.log('Registration successful')
      
      // Save user data
      setUser(response.user)
      
      // Store token in localStorage
      localStorage.setItem('token', response.jwt)
      
      // Set token in cookie for server-side auth checks
      Cookies.set('token', response.jwt, { expires: 7 })
      
      // Make sure token is set in API client
      apiClient.setToken(response.jwt)
      
      router.push('/dashboard')
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    console.log('Logging out user')
    
    // Clear auth client state
    authClient.logout()
    
    // Clear API client token
    apiClient.clearToken()
    
    // Clear React state
    setUser(null)
    
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Clear cookies
    Cookies.remove('token')
  }

  const logout = () => {
    handleLogout()
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 