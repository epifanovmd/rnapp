import { CancelablePromise, toCancelable } from "./cancelable";
import { ApiError, CanceledError, toApiError, toRequestInfo } from "./errors";
import { composeMiddleware, HttpHandler, HttpMiddleware } from "./middleware";
import type { HttpTransport } from "./transport";
import type {
  ApiResponse,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  RequestContext,
  RequestOptions,
} from "./types";

export interface HttpClientConfig {
  /** Геттер читается на каждый запрос — стенд можно менять в рантайме. */
  baseUrl: string | (() => string);
  /** Первый в списке — самый внешний, он видит итоговый результат. */
  middlewares?: readonly HttpMiddleware[];
  headers?: HttpHeaders;
  timeout?: number;
  withCredentials?: boolean;
}

export interface IHttpClient {
  /** Основной способ: не реджектится, ошибка приходит в `error`. */
  request<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>>;

  /** Ответ целиком со статусом и заголовками; реджектится `ApiError`. */
  send<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<HttpResponse<TData>>;
}

const DEFAULT_CANCEL_REASON = "Request canceled";

/** Нормализует запрос, заводит отмену и прогоняет его через пайплайн. */
export class HttpClient implements IHttpClient {
  private readonly _handler: HttpHandler;

  constructor(
    private readonly _config: HttpClientConfig,
    transport: HttpTransport,
  ) {
    // Отменённый до отправки запрос не должен уйти в сеть.
    this._handler = composeMiddleware(_config.middlewares ?? [], ctx =>
      ctx.signal.aborted
        ? Promise.reject(new CanceledError())
        : transport.send(ctx.request, ctx.signal),
    );
  }

  send<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options: RequestOptions = {},
  ): CancelablePromise<HttpResponse<TData>> {
    const controller = new AbortController();
    let cancelReason: string | undefined;

    const cancel = (reason?: string) => {
      if (controller.signal.aborted) return;
      cancelReason = reason ?? DEFAULT_CANCEL_REASON;
      controller.abort(cancelReason);
    };

    linkExternalSignal(options.signal, cancel);

    const ctx: RequestContext<TBody> = {
      request: this._normalizeRequest(request, options),
      options,
      signal: controller.signal,
      state: {},
      cancel,
    };

    const promise = this._handler(ctx as RequestContext).then(
      response => response as HttpResponse<TData>,
      (error: unknown) => {
        const info = toRequestInfo(ctx.request);

        if (controller.signal.aborted) {
          throw new CanceledError(cancelReason, {
            request: info,
            cause: error,
          });
        }

        throw toApiError(error, info);
      },
    );

    return toCancelable(promise, cancel);
  }

  request<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    const pending = this.send<TData, TBody>(request, options);

    const promise = pending.then(
      (response): ApiResponse<TData> => ({ data: response.data }),
      (error: ApiError): ApiResponse<TData> => ({ error }),
    );

    return toCancelable(promise, reason => pending.cancel(reason));
  }

  /** Собирает итоговый запрос: клиент, запрос и per-call options. */
  private _normalizeRequest<TBody>(
    request: HttpRequest<TBody>,
    options: RequestOptions,
  ): HttpRequest<TBody> {
    const { baseUrl, headers, timeout, withCredentials } = this._config;

    return {
      ...request,
      method: (request.method ?? "GET").toUpperCase() as HttpMethod,
      baseUrl:
        options.baseUrl ??
        request.baseUrl ??
        (typeof baseUrl === "function" ? baseUrl() : baseUrl),
      headers: mergeHeaders(
        [headers, request.headers, options.headers],
        request.data,
      ),
      params:
        request.params || options.params
          ? { ...request.params, ...options.params }
          : undefined,
      timeout: options.timeout ?? request.timeout ?? timeout,
      responseType: options.responseType ?? request.responseType,
      withCredentials: request.withCredentials ?? withCredentials,
      onUploadProgress: options.onUploadProgress ?? request.onUploadProgress,
      onDownloadProgress:
        options.onDownloadProgress ?? request.onDownloadProgress,
    };
  }
}

const CONTENT_TYPE = "content-type";

const isFormDataBody = (body: unknown): boolean =>
  typeof FormData !== "undefined" && body instanceof FormData;

const hasContentType = (headers?: HttpHeaders): boolean =>
  !!headers &&
  Object.keys(headers).some(key => key.toLowerCase() === CONTENT_TYPE);

/**
 * Заголовки клиента, запроса и вызова в порядке усиления; имена сравниваются
 * без учёта регистра.
 *
 * У тела `FormData` дефолтный `Content-Type` снимается: с JSON-типом axios
 * сериализует форму в JSON и файл теряется. Явный заголовок запроса или
 * вызова сохраняется.
 */
const mergeHeaders = (
  sources: (HttpHeaders | undefined)[],
  body: unknown,
): HttpHeaders => {
  const [, requestHeaders, optionHeaders] = sources;
  const merged = new Map<string, [string, string]>();

  sources.forEach(source => {
    Object.entries(source ?? {}).forEach(([name, value]) => {
      merged.set(name.toLowerCase(), [name, value]);
    });
  });

  const keepContentType =
    !isFormDataBody(body) ||
    hasContentType(requestHeaders) ||
    hasContentType(optionHeaders);

  if (!keepContentType) merged.delete(CONTENT_TYPE);

  return Object.fromEntries(merged.values());
};

/** Связывает внешний `AbortSignal` с отменой запроса. */
const linkExternalSignal = (
  signal: AbortSignal | undefined,
  cancel: (reason?: string) => void,
): void => {
  if (!signal) return;

  const forward = () =>
    cancel(typeof signal.reason === "string" ? signal.reason : undefined);

  if (signal.aborted) {
    forward();
  } else {
    signal.addEventListener("abort", forward, { once: true });
  }
};
