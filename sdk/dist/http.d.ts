import type { CertoClientOptions } from './types.js';
/**
 * Low-level HTTP helper shared by all resource classes.
 * Handles auth headers, JSON serialisation, and error mapping.
 */
export declare class HttpClient {
    readonly baseUrl: string;
    private token;
    private _fetch;
    constructor(opts?: CertoClientOptions);
    /** Replace the bearer token (e.g. after login). */
    setToken(token: string): void;
    /** Clear the bearer token (e.g. after logout). */
    clearToken(): void;
    request<T = unknown>(method: string, pathname: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T>;
    get<T>(pathname: string): Promise<T>;
    post<T>(pathname: string, body?: unknown): Promise<T>;
    put<T>(pathname: string, body?: unknown): Promise<T>;
    delete<T>(pathname: string): Promise<T>;
}
//# sourceMappingURL=http.d.ts.map