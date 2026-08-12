import { HttpClient } from './http.js';
import { AuthResource } from './resources/auth.js';
import { AchievementsResource } from './resources/achievements.js';
import { CredentialsResource } from './resources/credentials.js';
import { ProfilesResource } from './resources/profiles.js';
import { ScheduledResource } from './resources/scheduled.js';
import { RequestsResource } from './resources/requests.js';
import type { CertoClientOptions } from './types.js';

/**
 * The main entry point for the Certo SDK.
 *
 * @example
 * ```typescript
 * import { CertoClient } from '@certo/sdk';
 *
 * const client = new CertoClient({ baseUrl: 'https://api.example.com' });
 * await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });
 *
 * const { verified } = await client.credentials.verify('urn:uuid:abc123');
 * ```
 */
export class CertoClient {
  /** @internal */
  readonly _http: HttpClient;

  /** Authentication — login / logout */
  readonly auth: AuthResource;

  /** Badge definitions (achievements) */
  readonly achievements: AchievementsResource;

  /** Credential lifecycle — issue, verify, revoke, export */
  readonly credentials: CredentialsResource;

  /** Issuer and recipient profiles */
  readonly profiles: ProfilesResource;

  /** Scheduled (future-dated) credential issuance */
  readonly scheduled: ScheduledResource;

  /** Approval workflow — submit, approve, reject credential requests */
  readonly requests: RequestsResource;

  constructor(opts: CertoClientOptions = {}) {
    this._http = new HttpClient(opts);
    this.auth = new AuthResource(this._http);
    this.achievements = new AchievementsResource(this._http);
    this.credentials = new CredentialsResource(this._http);
    this.profiles = new ProfilesResource(this._http);
    this.scheduled = new ScheduledResource(this._http);
    this.requests = new RequestsResource(this._http);
  }

  /**
   * Convenience: set a bearer token directly without going through login.
   * Useful when you already have a long-lived API token.
   *
   * @example
   * const client = new CertoClient({ baseUrl: '…', token: process.env.CERTO_TOKEN });
   */
  setToken(token: string): this {
    this._http.setToken(token);
    return this;
  }
}
