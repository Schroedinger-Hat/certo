import type { HttpClient } from '../http.js';
import type { CredentialRequest, CreateCredentialRequestInput, StrapiListResponse, StrapiSingleResponse } from '../types.js';
export declare class RequestsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List credential requests. Issuers see all incoming requests; recipients
     * see their own outgoing requests.
     *
     * @example
     * const { data } = await client.requests.list();
     */
    list(params?: {
        page?: number;
        pageSize?: number;
    }): Promise<StrapiListResponse<CredentialRequest>>;
    /**
     * Submit a new credential request for a recipient.
     *
     * @example
     * const { data } = await client.requests.create({
     *   achievementId: 3,
     *   message: 'I completed the course in March 2026.',
     * });
     */
    create(input: CreateCredentialRequestInput): Promise<StrapiSingleResponse<CredentialRequest>>;
    /**
     * Approve a pending credential request (issuer action).
     * Once approved the system automatically issues the credential.
     *
     * @example
     * await client.requests.approve(5, 'Great work!');
     */
    approve(id: number | string, reviewNote?: string): Promise<StrapiSingleResponse<CredentialRequest>>;
    /**
     * Reject a pending credential request (issuer action).
     *
     * @example
     * await client.requests.reject(5, 'Insufficient evidence provided.');
     */
    reject(id: number | string, reviewNote?: string): Promise<StrapiSingleResponse<CredentialRequest>>;
}
//# sourceMappingURL=requests.d.ts.map