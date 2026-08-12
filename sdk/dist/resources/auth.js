export class AuthResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * Authenticate with email/password and return a JWT.
     * The JWT is automatically applied to all subsequent requests on this client.
     *
     * @example
     * const { jwt, user } = await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });
     */
    async login(opts) {
        const res = await this.http.post('/api/auth/local', {
            identifier: opts.identifier,
            password: opts.password,
        });
        this.http.setToken(res.jwt);
        return res;
    }
    /**
     * Clear the stored JWT from this client instance.
     */
    logout() {
        this.http.clearToken();
    }
}
//# sourceMappingURL=auth.js.map