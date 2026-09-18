import type { HttpRequest, HttpResponse } from "./types";

/**
 * Конец пайплайна: отправляет запрос. Обязан слушать `signal` и реджектить
 * только `ApiError`.
 */
export interface HttpTransport {
  send<TData = unknown>(
    request: HttpRequest,
    signal: AbortSignal,
  ): Promise<HttpResponse<TData>>;
}
