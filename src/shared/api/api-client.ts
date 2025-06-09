import {
  StrapiResponse,
  StrapiSingleResponse,
  StrapiError,
  AchievementCredential,
  VerificationResult,
} from '../types'

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
      }
    }
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
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
    } else if (typeof window !== 'undefined') {
      // Try to get token from localStorage if not already set
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        this.token = storedToken
        headers.Authorization = `Bearer ${storedToken}`
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

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`
        try {
          const errorData = await response.json() as StrapiError
          errorMessage = errorData.error?.message || errorMessage
        } catch (parseError) {
          // Could not parse error response
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
    return this.post<any>('/api/assertions/issue', {
      badgeId,
      recipient,
      evidence,
    })
  }

  /**
   * Verify a badge assertion
   */
  async verifyBadge(id: string): Promise<VerificationResult> {
    return this.get<VerificationResult>(`/api/assertions/${id}/verify`)
  }

  /**
   * Validate an external badge
   */
  async validateExternalBadge(badgeData: any): Promise<VerificationResult> {
    return this.post<VerificationResult>('/api/assertions/validate', {
      badge: badgeData
    })
  }

  /**
   * Get user certificates
   */
  async getUserCertificates() {
    return this.get<StrapiResponse<any>>('/api/certificates/user')
  }

  /**
   * Get issued certificates
   */
  async getIssuedCertificates() {
    return this.get<StrapiResponse<any>>('/api/certificates/issued')
  }

  /**
   * Get received certificates
   */
  async getReceivedCertificates() {
    return this.get<StrapiResponse<any>>('/api/certificates/received')
  }

  /**
   * Export certificate
   */
  async exportCertificate(id: number | string) {
    return this.get<any>(`/api/certificates/${id}/export`)
  }

  /**
   * Import certificate
   */
  async importCertificate(certificateData: any) {
    return this.post<any>('/api/certificates/import', certificateData)
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(id: number | string, reason: string) {
    return this.post<any>(`/api/certificates/${id}/revoke`, { reason })
  }

  /**
   * Get issuer keys
   */
  async getIssuerKeys(id: number | string) {
    return this.get<any>(`/api/profiles/${id}/keys`)
  }

  /**
   * Get certificate URL
   */
  getCertificateUrl(id: number | string): string {
    return `${this.baseUrl}/api/certificates/${id}`
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()

export default apiClient 