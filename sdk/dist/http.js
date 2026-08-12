import { CertoApiError } from './errors.js';
/**
 * Low-level HTTP helper shared by all resource classes.
 * Handles auth headers, JSON serialisation, and error mapping.
 */
export class HttpClient {
    constructor(opts = {}) {
        this.baseUrl = (opts.baseUrl ?? 'http://localhost:1337').replace(/\/$/, '');
        this.token = opts.token;
        this._fetch = opts.fetch ?? globalThis.fetch;
    }
    /** Replace the bearer token (e.g. after login). */
    setToken(token) {
        this.token = token;
    }
    /** Clear the bearer token (e.g. after logout). */
    clearToken() {
        this.token = undefined;
    }
    async request(method, pathname, body, extraHeaders) {
        const url = `${this.baseUrl}${pathname}`;
        const headers = {
            'Content-Type': 'application/json',
            ...extraHeaders,
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        const res = await this._fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        let json;
        try {
            json = await res.json();
        }
        catch {
            json = null;
        }
        if (!res.ok) {
            const message = json?.error?.message ||
                json?.message ||
                `HTTP ${res.status}`;
            throw new CertoApiError(message, res.status, json);
        }
        return json;
    }
    get(pathname) {
        return this.request('GET', pathname);
    }
    post(pathname, body) {
        return this.request('POST', pathname, body);
    }
    put(pathname, body) {
        return this.request('PUT', pathname, body);
    }
    delete(pathname) {
        return this.request('DELETE', pathname);
    }
}
//# sourceMappingURL=http.js.map