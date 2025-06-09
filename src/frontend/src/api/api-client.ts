import {
  StrapiResponse,
  StrapiSingleResponse,
  StrapiError,
  AchievementCredential,
  VerificationResult,
} from '../types/openbadges'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'

/**
 * API client for interacting with the Strapi backend
 */
export class ApiClient {
  private baseUrl: string
  private token: string | null

  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl
    this.token = null
    
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        this.token = storedToken
        console.log('Token initialized from localStorage')
      }
    }
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    console.log('Setting token:', token.substring(0, 10) + '...')
    this.token = token
    
    // Also store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    console.log('Clearing token')
    this.token = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  /**
   * Create request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
      console.log('Using token in request:', this.token.substring(0, 10) + '...')
    } else if (typeof window !== 'undefined') {
      // Try to get token from localStorage if not already set
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        this.token = storedToken
        headers.Authorization = `Bearer ${storedToken}`
        console.log('Retrieved token from localStorage for request:', storedToken.substring(0, 10) + '...')
      } else {
        console.warn('No authentication token available for request')
      }
    }

    return headers
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders()

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }

    console.log(`Making ${options.method || 'GET'} request to: ${url}`)

    try {
      const response = await fetch(url, config)
      console.log(`Response status for ${url}: ${response.status}`)

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`
        try {
          const errorData = await response.json() as StrapiError
          errorMessage = errorData.error?.message || errorMessage
          console.error('API error details:', errorData)
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      if (response.status === 204) {
        return {} as T
      }

      return await response.json() as T
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : ''
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' })
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Badge-specific methods

  /**
   * Get all badges
   */
  async getBadges(params?: Record<string, string>) {
    return this.get<StrapiResponse<any>>('/api/achievements', params)
  }

  /**
   * Get a specific badge by ID
   */
  async getBadge(id: number | string) {
    return this.get<StrapiSingleResponse<any>>(`/api/achievements/${id}`)
  }

  /**
   * Get all issuers
   */
  async getIssuers(params?: Record<string, string>) {
    return this.get<StrapiResponse<any>>('/api/profiles', params)
  }

  /**
   * Get a specific issuer by ID
   */
  async getIssuer(id: number | string) {
    return this.get<StrapiSingleResponse<any>>(`/api/profiles/${id}`)
  }

  /**
   * Issue a badge to a recipient
   */
  async issueBadge(badgeId: number, recipient: { id?: number; name: string; email: string }, evidence: any[] = []) {
    return this.post<any>('/api/credentials/issue', {
      data: {
        achievementId: badgeId,
        recipientId: recipient.id || 0,
        recipient: {
          name: recipient.name,
          email: recipient.email
        },
        evidence,
      }
    })
  }

  /**
   * Verify a badge assertion by ID
   */
  async verifyBadge(id: string): Promise<VerificationResult> {
    return this.get<VerificationResult>(`/api/credentials/${id}/verify`)
  }

  /**
   * Validate an external badge
   */
  async validateExternalBadge(badgeData: any): Promise<VerificationResult> {
    return this.post<VerificationResult>('/api/credentials/validate', {
      credential: badgeData
    })
  }

  // Certificate management methods

  /**
   * Get all certificates for the current user
   */
  async getUserCertificates() {
    return this.get<StrapiResponse<any>>('/api/credentials')
  }

  /**
   * Get certificates issued by the current user
   */
  async getIssuedCertificates() {
    return this.get<StrapiResponse<any>>('/api/profiles/me/issued-credentials')
  }

  /**
   * Get certificates received by the current user
   */
  async getReceivedCertificates() {
    return this.get<StrapiResponse<any>>('/api/profiles/me/received-credentials')
  }

  /**
   * Export a certificate by ID
   */
  async exportCertificate(id: number | string) {
    return this.get<any>(`/api/credentials/${id}/export`)
  }

  /**
   * Import a certificate from file data
   */
  async importCertificate(certificateData: any) {
    return this.post<any>('/api/credentials/import', { certificateData })
  }

  /**
   * Revoke a certificate by ID
   */
  async revokeCertificate(id: number | string, reason: string) {
    return this.post<any>(`/api/credentials/${id}/revoke`, { reason })
  }

  /**
   * Get issuer's public keys
   */
  async getIssuerKeys(id: number | string) {
    return this.get<any>(`/api/profiles/${id}/keys`)
  }

  /**
   * Get the certificate URL for a credential
   */
  getCertificateUrl(id: number | string): string {
    return `${this.baseUrl}/api/credentials/${id}/certificate`
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()

export default apiClient 