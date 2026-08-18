export class WebhooksResource {
    constructor(http) {
        this.http = http;
    }
    list() {
        return this.http.get('/api/webhook-subscriptions');
    }
    get(id) {
        return this.http.get(`/api/webhook-subscriptions/${id}`);
    }
    create(input) {
        return this.http.post('/api/webhook-subscriptions', { data: input });
    }
    update(id, input) {
        return this.http.put(`/api/webhook-subscriptions/${id}`, { data: input });
    }
    delete(id) {
        return this.http.delete(`/api/webhook-subscriptions/${id}`);
    }
}
//# sourceMappingURL=webhooks.js.map