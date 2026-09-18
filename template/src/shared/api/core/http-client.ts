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
  /** Строка или геттер — геттер читается на каждый запрос, поэтому URL можно менять в рантайме. */
  baseUrl: string | (() => string);
  /** Порядок важен: первый в списке — самый внешний (видит финальный результат). */
  middlewares?: readonly HttpMiddleware[];
  headers?: HttpHeaders;
  timeout?: number;
  withCredentials?: boolean;
}

export interface IHttpClient {
  /** Result-style: никогда не реджектится, ошибка — в `error`. Основной способ для сторов и UI. */
  request<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>>;

  /** Полный ответ (статус, заголовки); реджектится `ApiError`. Для ручных API, которым нужны метаданные. */
  send<TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<HttpResponse<TData>>;
}

const DEFAULT_CANCEL_REASON = "Request canceled";

export class HttpClient implements IHttpClient {
  private readonly _handler: HttpHandler;

  constructor(
    private readonly _config: HttpClientConfig,
    transport: HttpTransport,
  ) {
    // Уже отменённый запрос (query-race, внешний signal) до транспорта не доходит.
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
      headers: { ...headers, ...request.headers, ...options.headers },
      params:
        request.params || options.params
          ? { ...request.params, ...options.params }
          : undefined,
      timeout: options.timeout ?? request.timeout ?? timeout,
      responseType: options.responseType ?? request.responseType,
      withCredentials: request.withCredentials ?? withCredentials,
    };
  }
}

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
