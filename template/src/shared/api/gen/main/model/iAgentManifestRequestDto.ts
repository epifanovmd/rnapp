import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Запрос воркера к серверу (`POST /requests` на сокете агента).
 */
export interface IAgentManifestRequestDto {
  type: string;
  description?: string;
  /** JSON Schema `data` запроса: сервер проверяет до обработчика. */
  schema?: RecordStringUnknown;
  /** JSON Schema `data` ответа — описание, не проверяется. */
  response?: RecordStringUnknown;
}
