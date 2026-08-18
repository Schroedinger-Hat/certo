import type { HttpClient } from '../http.js';
import type { CreateWebhookSubscriptionInput, WebhookSubscription } from '../types.js';
export declare class WebhooksResource {
    private readonly http;
    constructor(http: HttpClient);
    list(): Promise<{
        data: WebhookSubscription[];
    }>;
    get(id: number): Promise<{
        data: WebhookSubscription;
    }>;
    create(input: CreateWebhookSubscriptionInput): Promise<{
        data: WebhookSubscription;
    }>;
    update(id: number, input: Partial<CreateWebhookSubscriptionInput> & {
        enabled?: boolean;
    }): Promise<{
        data: WebhookSubscription;
    }>;
    delete(id: number): Promise<{
        data: WebhookSubscription;
    }>;
}
//# sourceMappingURL=webhooks.d.ts.map