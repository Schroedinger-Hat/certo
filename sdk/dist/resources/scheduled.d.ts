import type { HttpClient } from '../http.js';
import type { ScheduledIssuance, CreateScheduledIssuanceInput, StrapiListResponse, StrapiSingleResponse } from '../types.js';
export declare class ScheduledResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all pending and completed scheduled issuances for the authenticated issuer.
     *
     * @example
     * const { data } = await client.scheduled.list();
     */
    list(params?: {
        page?: number;
        pageSize?: number;
    }): Promise<StrapiListResponse<ScheduledIssuance>>;
    /**
     * Get a single scheduled issuance by id.
     *
     * @example
     * const { data } = await client.scheduled.get(1);
     */
    get(id: number | string): Promise<StrapiSingleResponse<ScheduledIssuance>>;
    /**
     * Schedule a credential to be issued automatically at a future date.
     *
     * @example
     * const { data } = await client.scheduled.create({
     *   achievementId: 1,
     *   recipientEmail: 'alice@example.com',
     *   scheduledFor: '2026-12-31T00:00:00.000Z',
     * });
     */
    create(input: CreateScheduledIssuanceInput): Promise<StrapiSingleResponse<ScheduledIssuance>>;
    /**
     * Cancel a pending scheduled issuance.
     *
     * @example
     * await client.scheduled.cancel(1);
     */
    cancel(id: number | string): Promise<StrapiSingleResponse<ScheduledIssuance>>;
}
//# sourceMappingURL=scheduled.d.ts.map