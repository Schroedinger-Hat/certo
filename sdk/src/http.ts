import { CertoApiError } from './errors.js';
import type { CertoClientOptions } from './types.js';

/**
 * Low-level HTTP helper shared by all resource classes.
 * Handles auth headers, JSON serialisation, and error mapping.
 */
export class HttpClient {
  readonly baseUrl: string;
  private token: string | undefined;
  private _fetch: typeof globalThis.fetch;

  constructor(opts: CertoClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? 'http://localhost:1337').replace(/\/$/, '');
    this.token = opts.token;
    this._fetch = opts.fetch ?? globalThis.fetch;
  }

  /** Replace the bearer token (e.g. after login). */
  setToken(token: string): void {
    this.token = token;
  }

  /** Clear the bearer token (e.g. after logout). */
  clearToken(): void {
    this.token = undefined;
  }

  async request<T = unknown>(
    method: string,
    pathname: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.baseUrl}${pathname}`;
    const headers: Record<string, string> = {
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

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      const message =
        (json as any)?.error?.message ||
        (json as any)?.message ||
        `HTTP ${res.status}`;
      throw new CertoApiError(message, res.status, json);
    }

    return json as T;
  }

  get<T>(pathname: string): Promise<T> {
    return this.request<T>('GET', pathname);
  }

  post<T>(pathname: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', pathname, body);
  }

  put<T>(pathname: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', pathname, body);
  }

  delete<T>(pathname: string): Promise<T> {
    return this.request<T>('DELETE', pathname);
  }
}
