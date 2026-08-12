import type { HttpClient } from '../http.js';
import type {
  ScheduledIssuance,
  CreateScheduledIssuanceInput,
  StrapiListResponse,
  StrapiSingleResponse,
} from '../types.js';

export class ScheduledResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all pending and completed scheduled issuances for the authenticated issuer.
   *
   * @example
   * const { data } = await client.scheduled.list();
   */
  list(params?: { page?: number; pageSize?: number }): Promise<StrapiListResponse<ScheduledIssuance>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('pagination[page]', String(params.page));
    if (params?.pageSize) qs.set('pagination[pageSize]', String(params.pageSize));
    const query = qs.toString() ? `?${qs}` : '';
    return this.http.get<StrapiListResponse<ScheduledIssuance>>(`/api/scheduled-issuances${query}`);
  }

  /**
   * Get a single scheduled issuance by id.
   *
   * @example
   * const { data } = await client.scheduled.get(1);
   */
  get(id: number | string): Promise<StrapiSingleResponse<ScheduledIssuance>> {
    return this.http.get<StrapiSingleResponse<ScheduledIssuance>>(`/api/scheduled-issuances/${id}`);
  }

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
  create(input: CreateScheduledIssuanceInput): Promise<StrapiSingleResponse<ScheduledIssuance>> {
    return this.http.post<StrapiSingleResponse<ScheduledIssuance>>('/api/scheduled-issuances', {
      data: {
        achievement: input.achievementId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        scheduledFor: input.scheduledFor,
        expirationDate: input.expirationDate,
      },
    });
  }

  /**
   * Cancel a pending scheduled issuance.
   *
   * @example
   * await client.scheduled.cancel(1);
   */
  cancel(id: number | string): Promise<StrapiSingleResponse<ScheduledIssuance>> {
    return this.http.put<StrapiSingleResponse<ScheduledIssuance>>(
      `/api/scheduled-issuances/${id}`,
      { data: { status: 'cancelled' } },
    );
  }
}
