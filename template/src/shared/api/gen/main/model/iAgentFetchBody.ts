import type { IAgentFetchBodyEncoding } from "./iAgentFetchBodyEncoding";
import type { RecordStringString } from "./recordStringString";

/**
 * Запрос к воркеру через агента.
 */
export interface IAgentFetchBody {
  /**
   * HTTP-метод.
   * @pattern ^[A-Z]{1,16}$
   */
  method?: string;
  /**
   * Путь у воркера от `/`, с параметрами.
   * @maxLength 2048
   */
  path: string;
  /** Заголовки запроса. */
  headers?: RecordStringString;
  /** Тело: текст или base64 (`encoding: "base64"`). */
  body?: string;
  /** `utf8` (по умолчанию) | `base64`. */
  encoding?: IAgentFetchBodyEncoding;
  /** Срок, мс (по умолчанию 30 000, не больше 600 000). */
  timeoutMs?: number;
}
