import type {
  StrapiError,
  StrapiResponse,
  StrapiSingleResponse,
  VerificationResult,
} from '../types/openbadges'

/**
 * API client for interacting with the Strapi backend
 */
export class ApiClient {
  private baseUrl: string
  private token: string | null

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
    this.token = null

    // Initialize token from localStorage if available
    if (import.meta.client) {
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
    if (import.meta.client) {
      localStorage.setItem('token', token)
    }
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null

    if (import.meta.client) {
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
    }

    // Get token from instance, localStorage, or cookie
    let token = this.token

    if (!token && import.meta.client) {
      // Try localStorage
      const localToken = localStorage.getItem('token')
      if (localToken) {
        token = localToken
        this.token = localToken // Update instance token
      }
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    else {
      console.warn('No authentication token available for request')
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
    if (!this.baseUrl) {
      throw new Error('API baseUrl is not set. Make sure the Nuxt plugin initializes the API client before use.')
    }
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders()

    // For our own server API endpoints (not going directly to backend)
    const isLocalEndpoint = endpoint.startsWith('/api/') && !this.baseUrl.includes('1337')

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      // Only include credentials for our own server endpoints, not for direct backend calls
      credentials: isLocalEndpoint ? 'include' : 'omit',
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`
        let errorData: any = null

        try {
          errorData = await response.json() as StrapiError
          console.error('API error response:', errorData)

          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage

            // Add details for validation errors
            if (errorData.error.details && errorData.error.details.errors) {
              const errorDetails = errorData.error.details.errors
                .map((err: any) => `${err.path.join('.')}: ${err.message}`)
                .join('; ')

              if (errorDetails) {
                errorMessage += ` (${errorDetails})`
              }
            }
          }
        }
        catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }

        const error = new Error(errorMessage)
        // @ts-expect-error Add response data to error for debugging
        error.response = response
        // @ts-expect-error Add parsed error data to error for debugging
        error.data = errorData
        throw error
      }

      if (response.status === 204) {
        return {} as T
      }

      return await response.json() as T
    }
    catch (error) {
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
    try {
      // Always include populate=* to get nested data including images
      const populatedParams = {
        ...params,
        populate: '*'
      }

      const response = await this.get<any>('/api/achievements', populatedParams)

      // Handle different response formats
      if (Array.isArray(response)) {
        // Direct array format
        return response
      }
      else if (response && response.data && Array.isArray(response.data)) {
        // Strapi format with data array
        return response
      }
      else {
        console.error('Unexpected badge response format:', response)
        return { data: [] }
      }
    }
    catch (error) {
      console.error('Error fetching badges:', error)
      return { data: [] }
    }
  }

  /**
   * Get a specific badge by ID
   */
  async getBadge(id: number | string) {
    return this.get<StrapiSingleResponse<any>>(`/api/achievements/${id}?populate=*`)
  }

  /**
   * Get all issuers
   */
  async getIssuers(params?: Record<string, string>) {
    return this.get<StrapiResponse<any>>('/api/profiles', {
      ...params,
      'filters[profileType][$eq]': 'issuer',
      'populate': '*'
    })
  }

  /**
   * Get a specific issuer by ID
   */
  async getIssuer(id: number | string) {
    return this.get<StrapiSingleResponse<any>>(`/api/profiles/${id}?populate=*`)
  }

  /**
   * Create a new badge achievement
   */
  async createBadge(badgeData: any) {
    return this.post<StrapiSingleResponse<any>>('/api/achievements', {
      data: badgeData
    })
  }

  /**
   * Update an existing badge
   */
  async updateBadge(id: number | string, badgeData: any) {
    return this.put<StrapiSingleResponse<any>>(`/api/achievements/${id}`, {
      data: badgeData
    })
  }

  /**
   * Delete a badge
   */
  async deleteBadge(id: number | string) {
    return this.delete<any>(`/api/achievements/${id}`)
  }

  /**
   * Issue a badge to a recipient
   */
  async issueBadge(badgeId: number | string, recipient: { id?: number, name: string, email: string }, evidence: any[] = []) {
    if (!badgeId) {
      throw new Error('Badge ID is required')
    }

    if (!recipient || !recipient.email || !recipient.name) {
      throw new Error('Recipient email and name are required')
    }

    try {
      // Ensure we have a valid token
      const token = this.token || (import.meta.client ? localStorage.getItem('token') : null)
      if (!token) {
        throw new Error('Authentication required. Please log in to issue badges.')
      }

      const payload = {
        data: {
          achievementId: badgeId,
          recipientId: recipient.id || 0,
          recipient: {
            name: recipient.name,
            email: recipient.email
          },
          evidence,
        }
      }

      // Use our server proxy endpoint which will forward to backend
      const result = await this.post<any>('/api/credentials/issue', payload)

      // Add notification information for UI feedback
      if (result && !result.notification) {
        result.notification = {
          emailSent: true,
          emailError: null
        }
      }

      return result
    }
    catch (error) {
      console.error('Badge issuance error:', error)

      // Add more context to the error
      if (error instanceof Error) {
        // Check if there's a more specific error about the badge
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          error.message = `Badge with ID ${badgeId} not found or is not available for issuance`
        }
        else if (!error.message.includes('Authentication required')
          && !error.message.includes('Method not allowed')) {
          error.message = `Failed to issue badge: ${error.message}`
        }
      }

      throw error
    }
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
    try {
      const response = await this.get<StrapiResponse<any>>('/api/credentials')
      return {
        data: this.formatCredentials(response.data || []),
        meta: response.meta
      }
    }
    catch (error) {
      console.error('Error fetching user certificates:', error)
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    }
  }

  /**
   * Get certificates issued by the current user
   * First gets the current user profile, then gets credentials issued by that profile
   */
  async getIssuedCertificates() {
    try {
      // First get the current user's profile
      const profileResponse = await this.get<any>('/api/profiles/me')

      if (!profileResponse.data) {
        console.error('No profile data returned from /api/profiles/me')
        return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
      }

      // Extract profile ID depending on response structure
      let profileId = profileResponse?.data?.id
      if (Array.isArray(profileResponse.data) && profileResponse.data.length > 0) {
        profileId = profileResponse.data[0].id
      }

      // Then get credentials issued by that profile
      const response = await this.get<StrapiResponse<any>>(`/api/profiles/${profileId}/issued-credentials`)

      return {
        data: this.formatCredentials(response.data || []),
        meta: response.meta
      }
    }
    catch (error) {
      console.error('Error fetching issued certificates:', error)
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    }
  }

  /**
   * Get certificates received by the current user
   * First gets the current user profile, then gets credentials received by that profile
   */
  async getReceivedCertificates() {
    try {
      // First get the current user's profile
      const profileResponse = await this.get<any>('/api/profiles/me')

      if (!profileResponse.data) {
        console.error('No profile data returned from /api/profiles/me')
        return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
      }

      // Extract profile ID depending on response structure
      let profileId = profileResponse?.data?.id
      if (Array.isArray(profileResponse.data) && profileResponse.data.length > 0) {
        profileId = profileResponse.data[0].id
      }

      // Then get credentials received by that profile
      const response = await this.get<StrapiResponse<any>>(`/api/profiles/${profileId}/received-credentials`)

      return {
        data: this.formatCredentials(response.data || []),
        meta: response.meta
      }
    }
    catch (error) {
      console.error('Error fetching received certificates:', error)
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    }
  }

  /**
   * Export a certificate by ID
   */
  async exportCertificate(id: number | string) {
    return this.get<any>(`/api/credentials/${id}/export`)
  }

  /**
   * Import a certificate
   */
  async importCertificate(certificateData: any) {
    return this.post<any>('/api/credentials/import', { certificateData })
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(id: number | string, reason: string) {
    return this.post<any>(`/api/credentials/${id}/revoke`, { reason })
  }

  /**
   * Get issuer keys
   */
  async getIssuerKeys(id: number | string) {
    return this.get<any>(`/api/profiles/${id}/keys`)
  }

  /**
   * Get the public URL for a certificate
   */
  getCertificateUrl(id: number | string): string {
    return `${this.baseUrl}/api/credentials/${id}/certificate`
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(id: number | string) {
    return this.get<any>(`/api/credentials/${id}?populate=*`)
  }

  /**
   * Create/register a new issuer profile
   */
  async createIssuerProfile(profileData: any) {
    return this.post<any>('/api/profiles', {
      data: {
        ...profileData,
        profileType: 'issuer'
      }
    })
  }

  /**
   * Create/register a new recipient profile
   */
  async createRecipientProfile(profileData: any) {
    return this.post<any>('/api/profiles', {
      data: {
        ...profileData,
        profileType: 'recipient'
      }
    })
  }

  /**
   * Get the current user's profile
   */
  async getCurrentUserProfile() {
    return this.get<any>('/api/profiles/me')
  }

  /**
   * Search for badges by name, description, or issuer
   */
  async searchBadges(searchTerm: string) {
    return this.get<StrapiResponse<any>>('/api/achievements', {
      _q: searchTerm,
      populate: '*'
    })
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    try {
      const response = await this.get<any>('/api/dashboard/stats')
      return {
        data: response.data || {
          totalCertificates: 0,
          totalRecipients: 0,
          activeTemplates: 0
        }
      }
    }
    catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        data: {
          totalCertificates: 0,
          totalRecipients: 0,
          activeTemplates: 0
        }
      }
    }
  }

  /**
   * Format credential data to normalize structure
   * This helps handle different data formats from Strapi
   */
  formatCredential(credential: any) {
    if (!credential) {
      return null
    }

    const formatted: any = {
      id: credential.id,
      credentialId: credential.attributes?.credentialId || credential.credentialId || credential.id,
    }

    // Copy all attributes if they exist
    if (credential.attributes) {
      Object.assign(formatted, credential.attributes)
    }
    else {
      // If no attributes, copy all direct properties
      Object.assign(formatted, credential)
    }

    // Handle issuer data
    if (credential.attributes?.issuer?.data) {
      // Nested Strapi format
      formatted.issuer = credential.attributes.issuer.data.attributes || {}
      formatted.issuer.id = credential.attributes.issuer.data.id
    }
    else if (credential.issuer) {
      // Direct issuer object
      formatted.issuer = credential.issuer

      // Make sure the issuer name is available
      if (!formatted.issuer.name && credential.issuer.attributes?.name) {
        formatted.issuer.name = credential.issuer.attributes.name
      }
    }

    // Handle recipient data
    if (credential.attributes?.recipient?.data) {
      formatted.recipient = credential.attributes.recipient.data.attributes || {}
      formatted.recipient.id = credential.attributes.recipient.data.id
    }
    else if (credential.recipient) {
      formatted.recipient = credential.recipient
    }

    // Handle achievement data
    if (credential.attributes?.achievement?.data) {
      formatted.achievement = credential.attributes.achievement.data.attributes || {}
      formatted.achievement.id = credential.attributes.achievement.data.id
    }
    else if (credential.achievement) {
      formatted.achievement = credential.achievement
    }

    // Handle description
    if (!formatted.description) {
      formatted.description = credential.description
        || credential.attributes?.description
        || formatted.achievement?.description
        || 'No description available'
    }

    // Handle issuance date
    if (!formatted.issuanceDate) {
      formatted.issuanceDate = credential.issuanceDate
        || credential.attributes?.issuanceDate
        || credential.issuedOn
        || credential.attributes?.issuedOn
    }

    // Extract image URL if available
    if (credential.attributes?.image?.data?.attributes?.url) {
      formatted.imageUrl = credential.attributes.image.data.attributes.url
    }
    else if (credential.attributes?.achievement?.data?.attributes?.image?.data?.attributes?.url) {
      formatted.imageUrl = credential.attributes.achievement.data.attributes.image.data.attributes.url
    }
    else if (credential.achievement?.image?.url) {
      formatted.imageUrl = credential.achievement.image.url
    }
    else if (credential.image?.url) {
      formatted.imageUrl = credential.image.url
    }

    return formatted
  }

  /**
   * Format an array of credentials
   */
  formatCredentials(credentials: any[]) {
    if (!credentials || !Array.isArray(credentials)) {
      return []
    }
    return credentials.map(credential => this.formatCredential(credential))
  }

  /**
   * Batch issue badges to multiple recipients
   */
  async batchIssueBadges(
    badgeId: number | string,
    recipients: { name: string, email: string }[],
    evidence: any[] = []
  ) {
    if (!badgeId) {
      throw new Error('Badge ID is required')
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('At least one recipient is required')
    }
    try {
      const token = this.token || (import.meta.client ? localStorage.getItem('token') : null)
      if (!token) {
        throw new Error('Authentication required. Please log in to issue badges.')
      }
      const payload = {
        data: {
          achievementId: badgeId,
          recipients,
          evidence
        }
      }
      const result = await this.post<any>('/api/credentials/batch-issue', payload)
      return result
    }
    catch (error) {
      console.error('Batch badge issuance error:', error)
      throw error
    }
  }

  /**
   * Get available badges that can be issued
   */
  async getAvailableBadges() {
    try {
      const response = await this.get<StrapiResponse<any>>('/api/achievements', {
        'populate': '*',
        'filters[publishedAt][$notNull]': 'true'
      })

      if (!response.data) {
        return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
      }

      return {
        data: Array.isArray(response.data) ? response.data : [response.data],
        meta: response.meta
      }
    }
    catch (error) {
      console.error('Error fetching available badges:', error)
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    }
  }

  /**
   * Set the base URL for the API client
   */
  public setBaseUrl(url: string) {
    if (url) {
      this.baseUrl = url
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()

// This will be updated when the module is initialized in the browser
export function updateApiUrl(url: string) {
  apiClient.setBaseUrl(url)
}

export default apiClient
