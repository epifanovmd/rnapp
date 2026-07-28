import type { WebhookLogDto } from "./webhookLogDto";

export interface IWebhookLogsResponse {
  data: WebhookLogDto[];
  totalCount: number;
}
