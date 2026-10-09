import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Последний ответ воркера на `GET /health`.
 */
export interface IAgentWorkerHealthDto {
  ok: boolean;
  /** Идёт долгая работа: плановая замена воркера ждёт её окончания. */
  busy?: boolean;
  message?: string;
  /** Сведения от воркера (версии, порты и т. п.). */
  info?: RecordStringUnknown;
}
