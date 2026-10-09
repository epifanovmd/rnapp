import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Точка метрик: узел (`host`) и ответы `GET /metrics` воркеров.
 */
export interface IAgentMetricsPointDto {
  /** Время сбора на узле, мс. */
  at: number;
  host?: RecordStringUnknown;
  workers?: RecordStringUnknown;
}
