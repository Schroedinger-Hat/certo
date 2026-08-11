/**
 * @certo/sdk — Official JavaScript/TypeScript SDK for the Certo credential platform.
 *
 * @example
 * ```typescript
 * import { CertoClient } from '@certo/sdk';
 *
 * const client = new CertoClient({ baseUrl: 'https://api.example.com' });
 * await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });
 *
 * // Issue a credential
 * const result = await client.credentials.issue({
 *   achievementId: 1,
 *   recipientEmail: 'alice@example.com',
 *   recipientName: 'Alice Smith',
 * });
 *
 * // Verify a credential (no auth needed)
 * const { verified } = await client.credentials.verify('urn:uuid:…');
 * ```
 */
export { CertoClient } from './client.js';
export { CertoApiError } from './errors.js';
export { HttpClient } from './http.js';
export { AuthResource } from './resources/auth.js';
export { AchievementsResource } from './resources/achievements.js';
export { CredentialsResource } from './resources/credentials.js';
export { ProfilesResource } from './resources/profiles.js';
export { ScheduledResource } from './resources/scheduled.js';
export { RequestsResource } from './resources/requests.js';
export type { CertoClientOptions, StrapiListResponse, StrapiSingleResponse, StrapiMeta, LoginOptions, AuthResponse, Profile, ProfileType, ProfileExport, Achievement, CreateAchievementInput, Credential, CredentialStatus, IssueCredentialInput, VerifyResult, ListCredentialsOptions, RevocationCheckResult, ScheduledIssuance, CreateScheduledIssuanceInput, CredentialRequest, CredentialRequestStatus, CreateCredentialRequestInput, } from './types.js';
//# sourceMappingURL=index.d.ts.map