import { apiClient } from './api-client'

interface LoginResponse {
  jwt: string
  user: {
    id: number
    username: string
    email: string
    provider: string
    confirmed: boolean
    blocked: boolean
    createdAt: string
    updatedAt: string
  }
}

interface RegisterResponse extends LoginResponse {}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  identifier: string
  password: string
}

/**
 * Authentication client for user management
 */
export class AuthClient {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      console.log('Registering new user:', data.email)
      const response = await apiClient.post<RegisterResponse>('/api/auth/local/register', data)
      
      // Store auth data
      if (response.jwt) {
        this.saveToken(response.jwt)
        this.saveUser(response.user)
        apiClient.setToken(response.jwt)
        console.log('Registration successful, token saved')
      }
      
      return response
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Login a user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      console.log('Logging in user:', data.identifier)
      const response = await apiClient.post<LoginResponse>('/api/auth/local', data)
      
      // Set the token for future API calls
      if (response.jwt) {
        this.saveToken(response.jwt)
        this.saveUser(response.user)
        apiClient.setToken(response.jwt)
        console.log('Login successful, token saved')
      }
      
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout the current user
   */
  logout(): void {
    console.log('Logging out user')
    this.clearStorage()
    apiClient.clearToken()
  }

  /**
   * Check if a user is logged in
   */
  isAuthenticated(): boolean {
    if (!process.client) return false
    const token = this.getToken()
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    if (!process.client) return null
    
    try {
      const userJson = localStorage.getItem('user')
      if (!userJson) return null
      
      return JSON.parse(userJson)
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      return null
    }
  }

  /**
   * Get the stored authentication token
   */
  getToken(): string | null {
    if (!process.client) return null
    return localStorage.getItem('token')
  }

  /**
   * Save token to localStorage
   */
  private saveToken(token: string): void {
    if (process.client) {
      localStorage.setItem('token', token)
      console.log('Token saved to localStorage')
    }
  }

  /**
   * Save user to localStorage
   */
  private saveUser(user: any): void {
    if (process.client) {
      localStorage.setItem('user', JSON.stringify(user))
      console.log('User saved to localStorage')
    }
  }

  /**
   * Clear storage (token and user)
   */
  private clearStorage(): void {
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      console.log('Auth storage cleared')
    }
  }
}

// Export a singleton instance
export const authClient = new AuthClient()

export default authClient 