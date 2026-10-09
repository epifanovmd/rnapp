import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Маршрут воркера в манифесте: `{name}` в пути — один сегмент. Агент
 * пропускает к воркеру только объявленные маршруты (`ROUTE_UNDECLARED`).
 */
export interface IAgentManifestRouteDto {
  method: string;
  path: string;
  description?: string;
  /** JSON Schema тела запроса: сервер проверяет тело до отправки. */
  request?: RecordStringUnknown;
  /** JSON Schema тела ответа `2xx` — описание, не проверяется. */
  response?: RecordStringUnknown;
}
