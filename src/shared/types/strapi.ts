/**
 * Strapi specific type definitions for the application
 */

// Generic Strapi media types
export interface StrapiMedia {
  data: {
    id: number
    attributes: {
      name: string
      alternativeText?: string
      caption?: string
      width?: number
      height?: number
      formats?: {
        thumbnail?: StrapiMediaFormat
        small?: StrapiMediaFormat
        medium?: StrapiMediaFormat
        large?: StrapiMediaFormat
      }
      hash: string
      ext: string
      mime: string
      size: number
      url: string
      previewUrl?: string
      provider: string
      createdAt: string
      updatedAt: string
    }
  } | null
}

export interface StrapiMediaFormat {
  name: string
  hash: string
  ext: string
  mime: string
  width: number
  height: number
  size: number
  path?: string
  url: string
}

// Relation types
export interface StrapiRelation<T> {
  data: {
    id: number
    attributes: T
  } | null
}

export interface StrapiRelationArray<T> {
  data: {
    id: number
    attributes: T
  }[]
}

// Badge type
export interface Badge {
  id: number
  attributes: {
    name: string
    description: string
    criteria: string
    criteriaUrl?: string
    tags?: string[]
    image: StrapiMedia
    issuer: StrapiRelation<Issuer>
    alignments: {
      id: number
      targetName: string
      targetUrl: string
      targetDescription?: string
      targetFramework?: string
      targetCode?: string
    }[]
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

// Issuer type
export interface Issuer {
  id: number
  attributes: {
    name: string
    description: string
    url: string
    email: string
    image: StrapiMedia
    publicKey?: string
    badges: StrapiRelationArray<Badge>
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

// Assertion type
export interface Assertion {
  id: number
  attributes: {
    recipient: {
      type: string
      identity: {
        type: string
        hashed: boolean
        salt: string
        identity: string
      }
      name: string
      email: string
    }
    issuedOn: string
    expires?: string
    verification: {
      type: string
    }
    evidence: {
      id: number
      name: string
      description?: string
      narrative?: string
      genre?: string
      audience?: string
      url?: string
      mediaType?: string
      file?: StrapiMedia
    }[]
    narrative?: string
    badge: StrapiRelation<Badge>
    revoked: boolean
    revocationReason?: string
    bakedBadge?: StrapiMedia
    identifier: string
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

// Recipient type
export interface Recipient {
  id: number
  attributes: {
    name: string
    email: string
    identity: {
      type: string
      hashed: boolean
      salt: string
      identity: string
    }
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

// Endorsement type
export interface Endorsement {
  id: number
  attributes: {
    issuer: StrapiRelation<Issuer>
    claim: string
    issuedOn: string
    badgeClass: StrapiRelation<Badge>
    assertion: StrapiRelation<Assertion>
    verification: {
      type: string
    }
    endorsedBy: {
      id: string
      name: string
      url: string
      email?: string
    }
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}

// Strapi API response types
export interface StrapiResponse<T> {
  data: {
    id: number
    attributes: T
  }[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiSingleResponse<T> {
  data: {
    id: number
    attributes: T
  }
  meta: {}
}

export interface StrapiError {
  data: null
  error: {
    status: number
    name: string
    message: string
    details?: any
  }
} 