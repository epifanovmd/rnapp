import type { CancelablePromise } from "./cancelable";
import type { IHttpClient } from "./http-client";
import type {
  ApiResponse,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  RequestOptions,
} from "./types";

/**
 * База для рукописных API: эндпоинт объявляется одной строкой через
 * `get/post/put/patch/delete`. Клиент приходит снаружи, поэтому один и тот же
 * класс работает над любым бэкендом.
 */
export abstract class BaseApi {
  protected constructor(protected readonly http: IHttpClient) {}

  protected get<TData>(
    url: string,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.request<TData>({ url, method: "GET" }, options);
  }

  protected delete<TData>(
    url: string,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.request<TData>({ url, method: "DELETE" }, options);
  }

  protected post<TData, TBody = unknown>(
    url: string,
    data?: TBody,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.request<TData, TBody>({ url, method: "POST", data }, options);
  }

  protected put<TData, TBody = unknown>(
    url: string,
    data?: TBody,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.request<TData, TBody>({ url, method: "PUT", data }, options);
  }

  protected patch<TData, TBody = unknown>(
    url: string,
    data?: TBody,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.request<TData, TBody>({ url, method: "PATCH", data }, options);
  }

  /** Ответ целиком: для счётчиков в заголовках и различения 204 от пустого тела. */
  protected send<TData, TBody = unknown>(
    request: HttpRequest<TBody> & { method: HttpMethod },
    options?: RequestOptions,
  ): CancelablePromise<HttpResponse<TData>> {
    return this.http.send<TData, TBody>(request, options);
  }

  protected request<TData, TBody = unknown>(
    request: HttpRequest<TBody> & { method: HttpMethod },
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.http.request<TData, TBody>(request, options);
  }
}
