import type { HttpClient } from '../http.js';
import type {
  Credential,
  IssueCredentialInput,
  ListCredentialsOptions,
  ProfileExport,
  StrapiListResponse,
  StrapiSingleResponse,
  VerifyResult,
} from '../types.js';

export class CredentialsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List credentials. Without a token returns only publicly visible records;
   * with an issuer/admin token returns all matching credentials.
   *
   * @example
   * const { data, meta } = await client.credentials.list({ page: 1, pageSize: 20 });
   */
  list(opts: ListCredentialsOptions = {}): Promise<StrapiListResponse<Credential>> {
    const qs = new URLSearchParams();
    if (opts.page) qs.set('pagination[page]', String(opts.page));
    if (opts.pageSize) qs.set('pagination[pageSize]', String(opts.pageSize));
    if (opts.status) qs.set('filters[status][$eq]', opts.status);
    const query = qs.toString() ? `?${qs}` : '';
    return this.http.get<StrapiListResponse<Credential>>(`/api/credentials${query}`);
  }

  /**
   * Retrieve a single credential by numeric id or full URN
   * (e.g. `"urn:uuid:…"`).
   *
   * @example
   * const { data } = await client.credentials.get('urn:uuid:abc123');
   */
  get(id: number | string): Promise<StrapiSingleResponse<Credential>> {
    return this.http.get<StrapiSingleResponse<Credential>>(
      `/api/credentials/${encodeURIComponent(String(id))}`,
    );
  }

  /**
   * Issue a credential for a recipient against an existing achievement.
   * Requires an issuer or admin token.
   *
   * @example
   * const result = await client.credentials.issue({
   *   achievementId: 1,
   *   recipientEmail: 'alice@example.com',
   *   recipientName: 'Alice Smith',
   * });
   */
  issue(input: IssueCredentialInput): Promise<{ credential: Credential }> {
    return this.http.post<{ credential: Credential }>('/api/credentials/issue', {
      achievement: input.achievementId,
      recipient: {
        email: input.recipientEmail,
        name: input.recipientName,
      },
      expirationDate: input.expirationDate,
      evidence: input.evidence,
    });
  }

  /**
   * Verify a credential by id or URN. Works without authentication.
   *
   * @example
   * const result = await client.credentials.verify('urn:uuid:abc123');
   * if (result.verified) console.log('✓ Valid');
   */
  verify(id: number | string): Promise<VerifyResult> {
    return this.http.get<VerifyResult>(
      `/api/credentials/${encodeURIComponent(String(id))}/verify`,
    );
  }

  /**
   * Revoke a credential. Requires an issuer or admin token.
   *
   * @example
   * await client.credentials.revoke('urn:uuid:abc123', 'Duplicate issuance');
   */
  revoke(id: number | string, reason?: string): Promise<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `/api/credentials/${encodeURIComponent(String(id))}/revoke`,
      { reason },
    );
  }

  /**
   * Download the PDF/SVG certificate for a credential.
   * Returns a `Response` so callers can stream or save the file.
   *
   * @example
   * const res = await client.credentials.certificate('urn:uuid:abc123');
   * const svg = await res.text();
   */
  async certificate(id: number | string): Promise<Response> {
    const url = `${this.http.baseUrl}/api/credentials/${encodeURIComponent(String(id))}/certificate`;
    const headers: Record<string, string> = {};
    // Access the protected token via the http client helper
    const token = (this.http as any).token as string | undefined;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers });
  }

  /**
   * Export a credential as a JSON-LD Verifiable Credential document.
   *
   * @example
   * const vc = await client.credentials.export('urn:uuid:abc123');
   */
  export(id: number | string): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      `/api/credentials/${encodeURIComponent(String(id))}/export`,
    );
  }

  /**
   * Import a previously exported credential (JSON-LD VC).
   * Requires authentication.
   *
   * @example
   * await client.credentials.import(vcDocument);
   */
  import(vc: Record<string, unknown>): Promise<{ credential: Credential }> {
    return this.http.post<{ credential: Credential }>('/api/credentials/import', { vc });
  }

  /**
   * Batch-issue credentials to multiple recipients in a single request.
   * Returns the list of issued credentials.
   *
   * @example
   * const result = await client.credentials.batchIssue({
   *   achievementId: 1,
   *   recipients: [
   *     { email: 'a@example.com', name: 'Alice' },
   *     { email: 'b@example.com', name: 'Bob' },
   *   ],
   * });
   */
  batchIssue(input: {
    achievementId: number;
    recipients: Array<{ email: string; name?: string }>;
    expirationDate?: string;
  }): Promise<{ credentials: Credential[]; errors: Array<{ email: string; error: string }> }> {
    return this.http.post('/api/credentials/batch-issue', {
      achievement: input.achievementId,
      recipients: input.recipients,
      expirationDate: input.expirationDate,
    });
  }
}
