import { useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

interface StrapiImage {
  data?: {
    id: number
    attributes?: {
      url?: string
      formats?: {
        thumbnail?: { url: string }
        small?: { url: string }
        medium?: { url: string }
        large?: { url: string }
      }
    }
  }
}

interface StrapiCreator {
  data?: {
    id: number
    attributes?: {
      name?: string
      email?: string
    }
  }
}

interface BadgeAttributes {
  name?: string
  description?: string
  image?: StrapiImage
  creator?: StrapiCreator
  criteria?: string
  criteriaUrl?: string
  skills?: Array<{ name: string, level: string }>
  tags?: string[]
  type?: string
  createdAt?: string
  updatedAt?: string
}

interface Badge {
  id: number
  attributes?: BadgeAttributes
}

interface StrapiResponse<T> {
  data: T
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface Recipient {
  name: string
  email: string
  organization?: string
  expirationDate?: string
}

export default () => {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl
  const authStore = useAuthStore()

  async function getHeaders(): Promise<HeadersInit> {
    const token = authStore.token
    if (!token) {
      console.warn('No authentication token found')
      throw new Error('Authentication required')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async function getAvailableBadges(creatorId?: string): Promise<StrapiResponse<Badge[]>> {
    try {
      const headers = await getHeaders()
      let url = `${apiUrl}/api/achievements?populate=*`
      if (creatorId) {
        url = `${apiUrl}/api/achievements/creator/${creatorId}?populate=*`
      }
      const response = await fetch(url, {
        headers,
        credentials: 'include' // Include cookies if needed
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch badges:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Failed to fetch badges: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    }
    catch (error) {
      console.error('Error in getAvailableBadges:', error)
      throw error
    }
  }

  async function issueBadge(badgeId: string, recipient: Recipient, evidence: any[] = []): Promise<void> {
    try {
      const headers = await getHeaders()

      const response = await fetch(`${apiUrl}/api/credentials/issue`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          data: {
            achievementId: badgeId,
            recipient,
            evidence
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to issue badge:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Failed to issue badge: ${response.status} ${response.statusText}`)
      }
    }
    catch (error) {
      console.error('Error in issueBadge:', error)
      throw error
    }
  }

  async function batchIssueBadges(badgeId: string, recipients: Recipient[]): Promise<any> {
    try {
      const headers = await getHeaders()

      const response = await fetch(`${apiUrl}/api/credentials/batch-issue`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          data: {
            achievementId: badgeId,
            recipients
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to issue badges:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Failed to issue badges: ${response.status} ${response.statusText}`)
      }
      // Return the parsed response for per-recipient feedback
      return await response.json()
    }
    catch (error) {
      console.error('Error in batchIssueBadges:', error)
      throw error
    }
  }

  return {
    getAvailableBadges,
    issueBadge,
    batchIssueBadges,
  }
}

// Export types for use in other files
export type { Badge, BadgeAttributes, Recipient, StrapiCreator, StrapiImage }
