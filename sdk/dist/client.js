import { HttpClient } from './http.js';
import { AuthResource } from './resources/auth.js';
import { AchievementsResource } from './resources/achievements.js';
import { CredentialsResource } from './resources/credentials.js';
import { ProfilesResource } from './resources/profiles.js';
import { ScheduledResource } from './resources/scheduled.js';
import { RequestsResource } from './resources/requests.js';
import { WebhooksResource } from './resources/webhooks.js';
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
    constructor(opts = {}) {
        this._http = new HttpClient(opts);
        this.auth = new AuthResource(this._http);
        this.achievements = new AchievementsResource(this._http);
        this.credentials = new CredentialsResource(this._http);
        this.profiles = new ProfilesResource(this._http);
        this.scheduled = new ScheduledResource(this._http);
        this.requests = new RequestsResource(this._http);
        this.webhooks = new WebhooksResource(this._http);
    }
    /**
     * Convenience: set a bearer token directly without going through login.
     * Useful when you already have a long-lived API token.
     *
     * @example
     * const client = new CertoClient({ baseUrl: '…', token: process.env.CERTO_TOKEN });
     */
    setToken(token) {
        this._http.setToken(token);
        return this;
    }
}
//# sourceMappingURL=client.js.map