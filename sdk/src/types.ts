/**
 * All shared TypeScript types for the Certo SDK.
 */

// ──────────────────────────────────────────────────────────────
// Primitives
// ──────────────────────────────────────────────────────────────

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────

export interface LoginOptions {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    blocked: boolean;
    confirmed: boolean;
  };
}

// ──────────────────────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────────────────────

export type ProfileType = 'Issuer' | 'Recipient' | 'Both';

export interface Profile {
  id: number;
  documentId: string;
  name: string;
  email: string;
  profileType: ProfileType;
  description?: string;
  url?: string;
  image?: string | null;
  publicKey?: Array<{
    identifier: string;
    publicKeyJwk?: Record<string, string>;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Achievement (Badge definition)
// ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: number;
  documentId: string;
  achievementType: string;
  name: string;
  description: string;
  criteria?: string;
  image?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  creator?: Profile;
}

export interface CreateAchievementInput {
  name: string;
  description: string;
  achievementType?: string;
  criteria?: string;
  tags?: string[];
}

// ──────────────────────────────────────────────────────────────
// Credential
// ──────────────────────────────────────────────────────────────

export type CredentialStatus = 'active' | 'revoked' | 'expired';

export interface Credential {
  id: number;
  documentId: string;
  credential_id: string;
  name?: string;
  issuanceDate: string;
  expirationDate?: string | null;
  status: CredentialStatus;
  achievement?: Achievement;
  issuer?: Profile;
  recipient?: Profile;
  proof?: Record<string, unknown>;
  credentialSubject?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IssueCredentialInput {
  achievementId: number;
  recipientEmail: string;
  recipientName?: string;
  expirationDate?: string;
  evidence?: Array<{
    id?: string;
    type?: string;
    name?: string;
    description?: string;
    url?: string;
  }>;
}

export interface VerifyResult {
  verified: boolean;
  credential?: {
    name?: string;
    issuanceDate?: string;
    expirationDate?: string | null;
    issuer?: { name?: string };
  };
  checks?: Array<{
    check: string;
    result: 'success' | 'error' | 'warning';
    message?: string;
  }>;
  error?: string;
}

export interface ListCredentialsOptions {
  page?: number;
  pageSize?: number;
  /** Filter by issuer profile id */
  issuerId?: number;
  /** Filter by recipient profile id */
  recipientId?: number;
  status?: CredentialStatus;
}

// ──────────────────────────────────────────────────────────────
// Revocation
// ──────────────────────────────────────────────────────────────

export interface RevocationCheckResult {
  revoked: boolean;
  credential_id: string;
}

// ──────────────────────────────────────────────────────────────
// Scheduled Issuance
// ──────────────────────────────────────────────────────────────

export interface ScheduledIssuance {
  id: number;
  documentId: string;
  scheduledFor: string;
  status: 'pending' | 'issued' | 'failed' | 'cancelled';
  achievement?: Achievement;
  recipientEmail: string;
  recipientName?: string;
  expirationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledIssuanceInput {
  achievementId: number;
  recipientEmail: string;
  recipientName?: string;
  scheduledFor: string;
  expirationDate?: string;
}

// ──────────────────────────────────────────────────────────────
// Data portability (export / import)
// ──────────────────────────────────────────────────────────────

export interface ProfileExport {
  exportedAt: string;
  profile: Profile;
  achievements: Achievement[];
  credentials: Credential[];
}

// ──────────────────────────────────────────────────────────────
// Credential Request (approval workflows)
// ──────────────────────────────────────────────────────────────

export type CredentialRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'issued';

export interface CredentialRequest {
  id: number;
  documentId: string;
  status: CredentialRequestStatus;
  message?: string;
  reviewNote?: string;
  achievement?: Achievement;
  requester?: Profile;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialRequestInput {
  achievementId: number;
  message?: string;
}

// ──────────────────────────────────────────────────────────────
// SDK Client options
// ──────────────────────────────────────────────────────────────

export interface CertoClientOptions {
  /** Base URL of the Certo backend. Default: http://localhost:1337 */
  baseUrl?: string;
  /** Bearer token (Strapi JWT or API token) for authenticated requests */
  token?: string;
  /**
   * Custom fetch implementation. Defaults to the global `fetch`.
   * Useful for test mocking or environments without native fetch.
   */
  fetch?: typeof globalThis.fetch;
}
