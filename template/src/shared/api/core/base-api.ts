import type { CancelablePromise } from "./cancelable";
import type { IHttpClient } from "./http-client";
import type {
  ApiResponse,
  HttpMethod,
  HttpRequest,
  RequestOptions,
} from "./types";

/**
 * База для рукописных API: наследник объявляет эндпоинты одной строкой через
 * `get/post/put/patch/delete`. Клиент (baseUrl, middleware) приходит снаружи —
 * один класс можно поднять над разными бэкендами.
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

  protected request<TData, TBody = unknown>(
    request: HttpRequest<TBody> & { method: HttpMethod },
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> {
    return this.http.request<TData, TBody>(request, options);
  }
}
