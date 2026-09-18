import type { HttpHeaders, HttpRequest } from "./types";

export type ApiErrorKind =
  "http" | "network" | "timeout" | "canceled" | "unknown";

/** Куда шёл запрос — для логов и сообщений. */
export interface ApiRequestInfo {
  method: string;
  url: string;
}

interface ApiErrorInit {
  request?: ApiRequestInfo;
  cause?: unknown;
}

/**
 * Единственный тип ошибки, выходящий из клиента. Флаги `is*` доступны без
 * сужения типа, поэтому в UI и сторах не нужен `instanceof`.
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

  /** Машинный код: `kind`, а у HTTP-ошибки — код из тела или статус. */
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
  /** Задаёт сообщение вручную вместо разбора тела. */
  message?: string;
}

/** Сервер ответил со статусом вне 2xx; тело сохранено как есть. */
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

/** Ответа нет: нет сети, DNS, CORS, обрыв соединения. */
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

/** Запрос отменён: `cancel()`, внешний сигнал или гонка запросов. */
export class CanceledError extends ApiError {
  readonly kind = "canceled" as const;

  constructor(message = "Request canceled", init: ApiErrorInit = {}) {
    super(message, init);
  }
}

/** Не удалось классифицировать: например исключение внутри middleware. */
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

/** Тело ответа с ошибкой; у сетевых, таймаутов и отмены вернёт `undefined`. */
export const getErrorBody = <TBody = unknown>(
  error: unknown,
): TBody | undefined => (isHttpError<TBody>(error) ? error.body : undefined);

/** Приводит любое исключение к `ApiError`; готовый возвращает как есть. */
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

/** Метод и полный URL запроса для поля `request` у ошибки. */
export const toRequestInfo = (request: HttpRequest): ApiRequestInfo => ({
  method: (request.method ?? "GET").toUpperCase(),
  url: `${request.baseUrl ?? ""}${request.url}`,
});

const ERROR_MESSAGE_FIELDS = ["message", "reason", "error", "detail"] as const;

/** Сообщение из тела: строка или первое подходящее поле; иначе по статусу. */
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
