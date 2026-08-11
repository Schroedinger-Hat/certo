import type { HttpClient } from '../http.js';
import type { Achievement, CreateAchievementInput, StrapiListResponse, StrapiSingleResponse } from '../types.js';
export declare class AchievementsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all achievements (badge definitions) visible to the authenticated user.
     *
     * @example
     * const { data } = await client.achievements.list();
     */
    list(params?: {
        page?: number;
        pageSize?: number;
    }): Promise<StrapiListResponse<Achievement>>;
    /**
     * Get a single achievement by numeric id or Strapi documentId.
     *
     * @example
     * const { data } = await client.achievements.get(1);
     */
    get(id: number | string): Promise<StrapiSingleResponse<Achievement>>;
    /**
     * Create a new achievement. Requires an issuer or admin token.
     *
     * @example
     * const { data } = await client.achievements.create({
     *   name: 'JavaScript Expert',
     *   description: 'Awarded for demonstrating advanced JavaScript skills.',
     * });
     */
    create(input: CreateAchievementInput): Promise<StrapiSingleResponse<Achievement>>;
}
//# sourceMappingURL=achievements.d.ts.map