import type { RecordStringString } from "./recordStringString";

/**
 * Задача, выданная воркеру.
 */
export interface IClaimedJobDto {
  jobId: string;
  queue: string;
  data: unknown;
  /** Номер попытки, с 0: вернуть в heartbeat/complete/fail. */
  attempt: number;
  /** Heartbeat нужен чаще, чем раз в этот срок. */
  leaseSeconds: number;
  /** Подписанные ссылки на чтение входных файлов. */
  inputs: RecordStringString;
  /** Подписанные ссылки на загрузку результатов (PUT). */
  outputs: RecordStringString;
  /**
   * Content-Type, с которым подписана ссылка выхода: PUT обязан отправить
   * ровно его (иначе S3 отклонит подпись).
   */
  outputContentTypes: RecordStringString;
}
