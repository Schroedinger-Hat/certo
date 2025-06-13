/**
 * TypeScript definitions for Open Badges 3.0
 * Based on: https://www.imsglobal.org/spec/ob/v3p0/impl
 */

// Base types from Verifiable Credentials Data Model 2.0
export interface VerifiableCredential {
  '@context': string[] | string
  id: string
  type: string[]
  issuer: Issuer
  issuanceDate: string
  expirationDate?: string
  credentialSubject: CredentialSubject
  evidence?: Evidence[] | Evidence
  proof?: Proof | Proof[]
  refreshService?: RefreshService
  termsOfUse?: TermsOfUse[] | TermsOfUse
  [key: string]: any
}

export interface CredentialSubject {
  id?: string
  type?: string[]
  [key: string]: any
}

export interface Proof {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  proofValue?: string
  jws?: string
  [key: string]: any
}

export interface RefreshService {
  id: string
  type: string
  [key: string]: any
}

export interface TermsOfUse {
  id?: string
  type: string
  [key: string]: any
}

// Open Badges 3.0 specific types
export interface AchievementCredential extends VerifiableCredential {
  type: string[] // Must include 'AchievementCredential'
  name?: string
  description?: string
  image?: Image
  credentialSubject: AchievementSubject
  [key: string]: any
}

export interface Image {
  id: string
  type: string
  [key: string]: any
}

export interface AchievementSubject {
  id?: string
  type: string[] // Must include 'AchievementSubject'
  achievement: Achievement
  name?: string
  email?: string
  [key: string]: any
}

export interface Achievement {
  id: string
  type: string[] // Must include 'Achievement'
  name: string
  description?: string
  image?: Image
  criteria?: Criteria
  alignments?: Alignment[]
  tags?: string[]
  [key: string]: any
}

export interface Criteria {
  id?: string
  type?: string
  narrative?: string
  [key: string]: any
}

export interface Alignment {
  id?: string
  type?: string
  targetName: string
  targetUrl: string
  targetDescription?: string
  targetFramework?: string
  targetCode?: string
  [key: string]: any
}

export interface Evidence {
  id: string
  type: string[] // Must include 'Evidence'
  name?: string
  description?: string
  narrative?: string
  genre?: string
  audience?: string
  [key: string]: any
}

export interface Issuer {
  id: string
  type: string[] // Must include 'Profile'
  name: string
  url?: string
  email?: string
  image?: string | Image
  [key: string]: any
}

// Endorsement
export interface EndorsementCredential extends VerifiableCredential {
  type: string[] // Must include 'EndorsementCredential'
  credentialSubject: {
    id: string
    type: string[]
    endorsement?: Endorsement
    [key: string]: any
  }
  [key: string]: any
}

export interface Endorsement {
  id?: string
  claim: string
  [key: string]: any
}

// Strapi specific API response types
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

// Verification result type
export interface VerificationResult {
  verified: boolean
  checks?: VerificationCheck[]
  error?: string
  credential?: AchievementCredential
  rawCredential?: any
}

export interface VerificationCheck {
  check: string
  result: 'success' | 'warning' | 'error'
  message?: string
} 