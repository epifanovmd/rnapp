import type { ApiError } from "./errors";

export type HttpMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type HttpHeaders = Record<string, string>;
export type HttpQueryParams = Record<string, unknown>;
export type HttpResponseType = "json" | "text" | "blob" | "arraybuffer";

/** Описание одного HTTP-запроса. Это то, что генерирует orval и пишут руками в `BaseApi`. */
export interface HttpRequest<TData = unknown> {
  url: string;
  method?: HttpMethod | Lowercase<HttpMethod>;
  /** Переопределяет baseUrl клиента для конкретного запроса. */
  baseUrl?: string;
  params?: HttpQueryParams;
  data?: TData;
  headers?: HttpHeaders;
  timeout?: number;
  responseType?: HttpResponseType;
  withCredentials?: boolean;
}

/**
 * Per-call настройки — второй аргумент любого метода API.
 * Middleware расширяют интерфейс через declaration merging
 * (см. `auth?`, `queryRace?`, `notifyErrors?` в `middleware/`).
 */
export interface RequestOptions {
  headers?: HttpHeaders;
  params?: HttpQueryParams;
  timeout?: number;
  baseUrl?: string;
  responseType?: HttpResponseType;
  /** Внешний сигнал отмены; связывается с внутренним контроллером запроса. */
  signal?: AbortSignal;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  statusText?: string;
  headers: HttpHeaders;
  data: TData;
}

/** Контекст одного запроса, проходящий через все middleware до транспорта. */
export interface RequestContext<TData = unknown> {
  /** Нормализованный запрос (метод в верхнем регистре, baseUrl и заголовки уже слиты). Middleware вправе менять. */
  request: HttpRequest<TData>;
  readonly options: RequestOptions;
  readonly signal: AbortSignal;
  /** Request-scoped хранилище для состояния middleware. */
  readonly state: Record<string, unknown>;
  cancel(reason?: string): void;
}

/**
 * Result-style ответ: промис не реджектится, ошибка всегда `ApiError`.
 * Отмена — тоже ошибка (`error.isCanceled`), чтобы потребитель разбирал один union.
 */
export type ApiResponse<TData, TError extends ApiError = ApiError> =
  | { readonly data: TData; readonly error?: undefined }
  | { readonly data?: undefined; readonly error: TError };
