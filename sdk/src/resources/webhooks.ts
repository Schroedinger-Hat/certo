import type { HttpClient } from '../http.js';
import type { CreateWebhookSubscriptionInput, WebhookSubscription } from '../types.js';

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<{ data: WebhookSubscription[] }> {
    return this.http.get<{ data: WebhookSubscription[] }>('/api/webhook-subscriptions');
  }

  get(id: number): Promise<{ data: WebhookSubscription }> {
    return this.http.get<{ data: WebhookSubscription }>(`/api/webhook-subscriptions/${id}`);
  }

  create(input: CreateWebhookSubscriptionInput): Promise<{ data: WebhookSubscription }> {
    return this.http.post<{ data: WebhookSubscription }>('/api/webhook-subscriptions', { data: input });
  }

  update(id: number, input: Partial<CreateWebhookSubscriptionInput> & { enabled?: boolean }): Promise<{ data: WebhookSubscription }> {
    return this.http.put<{ data: WebhookSubscription }>(`/api/webhook-subscriptions/${id}`, { data: input });
  }

  delete(id: number): Promise<{ data: WebhookSubscription }> {
    return this.http.delete<{ data: WebhookSubscription }>(`/api/webhook-subscriptions/${id}`);
  }
}