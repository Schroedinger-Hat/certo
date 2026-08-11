import type { HttpClient } from '../http.js';
import type {
  AuthResponse,
  LoginOptions,
} from '../types.js';

export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Authenticate with email/password and return a JWT.
   * The JWT is automatically applied to all subsequent requests on this client.
   *
   * @example
   * const { jwt, user } = await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });
   */
  async login(opts: LoginOptions): Promise<AuthResponse> {
    const res = await this.http.post<AuthResponse>('/api/auth/local', {
      identifier: opts.identifier,
      password: opts.password,
    });
    this.http.setToken(res.jwt);
    return res;
  }

  /**
   * Clear the stored JWT from this client instance.
   */
  logout(): void {
    this.http.clearToken();
  }
}
