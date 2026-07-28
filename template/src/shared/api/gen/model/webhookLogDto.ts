import type { RecordStringUnknown } from "./recordStringUnknown";

export interface WebhookLogDto {
  id: string;
  eventType: string;
  payload: RecordStringUnknown | null;
  /** @nullable */
  statusCode: number | null;
  success: boolean;
  /** @nullable */
  errorMessage: string | null;
  attempts: number;
  /** @nullable */
  durationMs: number | null;
  createdAt: string;
}
