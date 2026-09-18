import type { HttpHeaders, HttpRequest } from "./types";

export type ApiErrorKind =
  "http" | "network" | "timeout" | "canceled" | "unknown";

/** Что известно о запросе в момент ошибки — для логов и сообщений. */
export interface ApiRequestInfo {
  method: string;
  url: string;
}

interface ApiErrorInit {
  request?: ApiRequestInfo;
  cause?: unknown;
}

/**
 * Базовый класс всех ошибок API-слоя. Наружу из `HttpClient` выходит только он:
 * транспорт и middleware обязаны заворачивать чужие исключения через `toApiError`.
 * Флаги `is*` доступны без сужения типа — удобно в UI и сторах.
 */
export abstract class ApiError extends Error {
  abstract readonly kind: ApiErrorKind;
  readonly request?: ApiRequestInfo;
  readonly cause?: unknown;

  protected constructor(message: string, init: ApiErrorInit = {}) {
    super(message);
    this.name = new.target.name;
    this.request = init.request;
    this.cause = init.cause;
  }

  /** HTTP-статус; есть только у `HttpError`. */
  get status(): number | undefined {
    return undefined;
  }

  /** Машинный код ошибки: `kind` или код из тела ответа. */
  get code(): string {
    return this.kind;
  }

  get isHttpError(): boolean {
    return this.kind === "http";
  }
  get isNetworkError(): boolean {
    return this.kind === "network";
  }
  get isTimeout(): boolean {
    return this.kind === "timeout";
  }
  get isCanceled(): boolean {
    return this.kind === "canceled";
  }
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
  get isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }
}

interface HttpErrorInit<TBody> extends ApiErrorInit {
  status: number;
  statusText?: string;
  body?: TBody;
  headers?: HttpHeaders;
  /** Явное сообщение; иначе берётся из тела ответа или статуса. */
  message?: string;
}

/** Сервер ответил, но статус вне 2xx. Тело ответа сохраняется как есть. */
export class HttpError<TBody = unknown> extends ApiError {
  readonly kind = "http" as const;
  readonly body: TBody | undefined;
  readonly headers: HttpHeaders;
  readonly statusText: string | undefined;
  private readonly _status: number;

  constructor(init: HttpErrorInit<TBody>) {
    super(
      init.message ??
        resolveHttpErrorMessage(init.body, init.status, init.statusText),
      init,
    );
    this._status = init.status;
    this.statusText = init.statusText;
    this.body = init.body;
    this.headers = init.headers ?? {};
  }

  override get status(): number {
    return this._status;
  }

  override get code(): string {
    return resolveHttpErrorCode(this.body) ?? String(this._status);
  }
}

/** Ответ не получен: нет сети, DNS, CORS, обрыв соединения. */
export class NetworkError extends ApiError {
  readonly kind = "network" as const;

  constructor(message = "Network error", init: ApiErrorInit = {}) {
    super(message, init);
  }
}

export class TimeoutError extends ApiError {
  readonly kind = "timeout" as const;

  constructor(message = "Request timed out", init: ApiErrorInit = {}) {
    super(message, init);
  }
}

/** Запрос отменён через `cancel()` / `AbortSignal` / query-race. */
export class CanceledError extends ApiError {
  readonly kind = "canceled" as const;

  constructor(message = "Request canceled", init: ApiErrorInit = {}) {
    super(message, init);
  }
}

/** Всё, что не удалось классифицировать: баг в middleware, исключение сериализации и т.п. */
export class UnknownApiError extends ApiError {
  readonly kind = "unknown" as const;

  constructor(message = "Request failed", init: ApiErrorInit = {}) {
    super(message, init);
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const isHttpError = <TBody = unknown>(
  error: unknown,
): error is HttpError<TBody> => error instanceof HttpError;

export const isCanceledError = (error: unknown): error is CanceledError =>
  error instanceof CanceledError;

export const isNetworkError = (error: unknown): error is NetworkError =>
  error instanceof NetworkError;

export const isTimeoutError = (error: unknown): error is TimeoutError =>
  error instanceof TimeoutError;

/** Нормализует любое исключение в `ApiError`. Уже готовый `ApiError` возвращается как есть. */
export const toApiError = (
  error: unknown,
  request?: ApiRequestInfo,
): ApiError => {
  if (isApiError(error)) return error;

  if (isAbortLike(error)) {
    return new CanceledError(undefined, { request, cause: error });
  }

  if (error instanceof Error) {
    return new UnknownApiError(error.message, { request, cause: error });
  }

  return new UnknownApiError(typeof error === "string" ? error : undefined, {
    request,
    cause: error,
  });
};

export const toRequestInfo = (request: HttpRequest): ApiRequestInfo => ({
  method: (request.method ?? "GET").toUpperCase(),
  url: `${request.baseUrl ?? ""}${request.url}`,
});

const ERROR_MESSAGE_FIELDS = ["message", "reason", "error", "detail"] as const;

/**
 * Сообщение из тела ответа: строка или первое строковое поле из
 * `message` / `reason` / `error` / `detail`. Иначе — по статусу.
 */
export const resolveHttpErrorMessage = (
  body: unknown,
  status: number,
  statusText?: string,
): string => {
  if (typeof body === "string" && body.trim()) return body;

  if (isRecord(body)) {
    for (const field of ERROR_MESSAGE_FIELDS) {
      const value = body[field];

      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return statusText
    ? `Request failed with status ${status} (${statusText})`
    : `Request failed with status ${status}`;
};

const resolveHttpErrorCode = (body: unknown): string | undefined => {
  if (!isRecord(body)) return undefined;

  const code = body.code ?? body.name;

  return typeof code === "string" && code ? code : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAbortLike = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === "AbortError";
