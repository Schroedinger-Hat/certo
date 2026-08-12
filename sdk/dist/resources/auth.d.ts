import type { HttpClient } from '../http.js';
import type { AuthResponse, LoginOptions } from '../types.js';
export declare class AuthResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Authenticate with email/password and return a JWT.
     * The JWT is automatically applied to all subsequent requests on this client.
     *
     * @example
     * const { jwt, user } = await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });
     */
    login(opts: LoginOptions): Promise<AuthResponse>;
    /**
     * Clear the stored JWT from this client instance.
     */
    logout(): void;
}
//# sourceMappingURL=auth.d.ts.map