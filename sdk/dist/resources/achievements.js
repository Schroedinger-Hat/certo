export class AchievementsResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * List all achievements (badge definitions) visible to the authenticated user.
     *
     * @example
     * const { data } = await client.achievements.list();
     */
    list(params) {
        const qs = new URLSearchParams();
        if (params?.page)
            qs.set('pagination[page]', String(params.page));
        if (params?.pageSize)
            qs.set('pagination[pageSize]', String(params.pageSize));
        const query = qs.toString() ? `?${qs}` : '';
        return this.http.get(`/api/achievements${query}`);
    }
    /**
     * Get a single achievement by numeric id or Strapi documentId.
     *
     * @example
     * const { data } = await client.achievements.get(1);
     */
    get(id) {
        return this.http.get(`/api/achievements/${id}`);
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
    create(input) {
        return this.http.post('/api/achievements', {
            data: input,
        });
    }
}
//# sourceMappingURL=achievements.js.map