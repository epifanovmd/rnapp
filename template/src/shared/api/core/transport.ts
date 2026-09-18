import type { HttpRequest, HttpResponse } from "./types";

/**
 * Последнее звено пайплайна: реально отправляет запрос. Обязан реджектить
 * только `ApiError` (см. `toApiError`) и уважать `signal`.
 */
export interface HttpTransport {
  send<TData = unknown>(
    request: HttpRequest,
    signal: AbortSignal,
  ): Promise<HttpResponse<TData>>;
}
