import type { HttpClient } from '../http.js';
import type {
  Achievement,
  CreateAchievementInput,
  StrapiListResponse,
  StrapiSingleResponse,
} from '../types.js';

export class AchievementsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all achievements (badge definitions) visible to the authenticated user.
   *
   * @example
   * const { data } = await client.achievements.list();
   */
  list(params?: { page?: number; pageSize?: number }): Promise<StrapiListResponse<Achievement>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('pagination[page]', String(params.page));
    if (params?.pageSize) qs.set('pagination[pageSize]', String(params.pageSize));
    const query = qs.toString() ? `?${qs}` : '';
    return this.http.get<StrapiListResponse<Achievement>>(`/api/achievements${query}`);
  }

  /**
   * Get a single achievement by numeric id or Strapi documentId.
   *
   * @example
   * const { data } = await client.achievements.get(1);
   */
  get(id: number | string): Promise<StrapiSingleResponse<Achievement>> {
    return this.http.get<StrapiSingleResponse<Achievement>>(`/api/achievements/${id}`);
  }

  /**
   * Create a new achievement. Requires an issuer or admin token.
   *
   * @example
   * const { data } = await client.achievements.create({
   *   name: 'JavaScript Expert',
   *   description: 'Awarded for demonstrating advanced JavaScript skills.',
   * });
   */
  create(input: CreateAchievementInput): Promise<StrapiSingleResponse<Achievement>> {
    return this.http.post<StrapiSingleResponse<Achievement>>('/api/achievements', {
      data: input,
    });
  }
}
