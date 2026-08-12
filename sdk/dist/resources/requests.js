export class RequestsResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * List credential requests. Issuers see all incoming requests; recipients
     * see their own outgoing requests.
     *
     * @example
     * const { data } = await client.requests.list();
     */
    list(params) {
        const qs = new URLSearchParams();
        if (params?.page)
            qs.set('pagination[page]', String(params.page));
        if (params?.pageSize)
            qs.set('pagination[pageSize]', String(params.pageSize));
        const query = qs.toString() ? `?${qs}` : '';
        return this.http.get(`/api/credential-requests${query}`);
    }
    /**
     * Submit a new credential request for a recipient.
     *
     * @example
     * const { data } = await client.requests.create({
     *   achievementId: 3,
     *   message: 'I completed the course in March 2026.',
     * });
     */
    create(input) {
        return this.http.post('/api/credential-requests', {
            data: {
                achievement: input.achievementId,
                message: input.message,
            },
        });
    }
    /**
     * Approve a pending credential request (issuer action).
     * Once approved the system automatically issues the credential.
     *
     * @example
     * await client.requests.approve(5, 'Great work!');
     */
    approve(id, reviewNote) {
        return this.http.put(`/api/credential-requests/${id}/approve`, { reviewNote });
    }
    /**
     * Reject a pending credential request (issuer action).
     *
     * @example
     * await client.requests.reject(5, 'Insufficient evidence provided.');
     */
    reject(id, reviewNote) {
        return this.http.put(`/api/credential-requests/${id}/reject`, { reviewNote });
    }
}
//# sourceMappingURL=requests.js.map