import type { HttpClient } from '../http.js';
import type { Credential, IssueCredentialInput, ListCredentialsOptions, StrapiListResponse, StrapiSingleResponse, VerifyResult } from '../types.js';
export declare class CredentialsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List credentials. Without a token returns only publicly visible records;
     * with an issuer/admin token returns all matching credentials.
     *
     * @example
     * const { data, meta } = await client.credentials.list({ page: 1, pageSize: 20 });
     */
    list(opts?: ListCredentialsOptions): Promise<StrapiListResponse<Credential>>;
    /**
     * Retrieve a single credential by numeric id or full URN
     * (e.g. `"urn:uuid:…"`).
     *
     * @example
     * const { data } = await client.credentials.get('urn:uuid:abc123');
     */
    get(id: number | string): Promise<StrapiSingleResponse<Credential>>;
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
    issue(input: IssueCredentialInput): Promise<{
        credential: Credential;
    }>;
    /**
     * Verify a credential by id or URN. Works without authentication.
     *
     * @example
     * const result = await client.credentials.verify('urn:uuid:abc123');
     * if (result.verified) console.log('✓ Valid');
     */
    verify(id: number | string): Promise<VerifyResult>;
    /**
     * Revoke a credential. Requires an issuer or admin token.
     *
     * @example
     * await client.credentials.revoke('urn:uuid:abc123', 'Duplicate issuance');
     */
    revoke(id: number | string, reason?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Download the PDF/SVG certificate for a credential.
     * Returns a `Response` so callers can stream or save the file.
     *
     * @example
     * const res = await client.credentials.certificate('urn:uuid:abc123');
     * const svg = await res.text();
     */
    certificate(id: number | string): Promise<Response>;
    /**
     * Export a credential as a JSON-LD Verifiable Credential document.
     *
     * @example
     * const vc = await client.credentials.export('urn:uuid:abc123');
     */
    export(id: number | string): Promise<Record<string, unknown>>;
    /**
     * Import a previously exported credential (JSON-LD VC).
     * Requires authentication.
     *
     * @example
     * await client.credentials.import(vcDocument);
     */
    import(vc: Record<string, unknown>): Promise<{
        credential: Credential;
    }>;
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
        recipients: Array<{
            email: string;
            name?: string;
        }>;
        expirationDate?: string;
    }): Promise<{
        credentials: Credential[];
        errors: Array<{
            email: string;
            error: string;
        }>;
    }>;
}
//# sourceMappingURL=credentials.d.ts.map