export interface IWebhookTestResponse {
  success: boolean;
  /** @nullable */
  statusCode: number | null;
  /** @nullable */
  errorMessage: string | null;
  durationMs: number;
}
