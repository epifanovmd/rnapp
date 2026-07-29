import { BASE_URL } from "@shared/config/env";
import { createInjectDecorator } from "@shared/lib/di";
import { INotificationService } from "@shared/lib/notifications";
import axios, {
  AxiosHeaders,
  AxiosResponse,
  CanceledError,
  CancelTokenSource,
} from "axios";
import { injectable } from "inversify";

import { ApiError } from "./api-error";
import { ITokenSource } from "./contract";
import { ApiRequestConfig, ApiResponse, CancelablePromise } from "./http.types";
import { QueryRace } from "./query-race";

export const IHttpClient = createInjectDecorator<IHttpClient>("IHttpClient");
export interface IHttpClient {
  request<R = any, P = any>(
    config: ApiRequestConfig<P>,
    options?: ApiRequestConfig<P>,
  ): CancelablePromise<ApiResponse<R, ApiError>>;
}

interface HttpClientResponse<R> {
  data?: R;
  error?: ApiError;
  isCanceled?: boolean;
}

type RetryableConfig = ApiRequestConfig & { _retry?: boolean };

const DEFAULT_HEADERS = new AxiosHeaders({
  Accept: "application/json",
  "Content-Type": "application/json",
});

@injectable()
export class HttpClient implements IHttpClient {
  private readonly _instance = axios.create({
    baseURL: BASE_URL,
    timeout: 2 * 60 * 1000,
    withCredentials: true,
    headers: DEFAULT_HEADERS,
  });
  private readonly _queryRace = new QueryRace();
  private _refreshPromise: Promise<boolean> | null = null;

  constructor(
    @ITokenSource() private _tokenSource: ITokenSource,
    @INotificationService() private _notifications: INotificationService,
  ) {
    this._setupInterceptors();
  }

  request<R = any, P = any>(
    config: ApiRequestConfig<P>,
    options?: ApiRequestConfig<P>,
  ): CancelablePromise<ApiResponse<R, ApiError>> {
    const source: CancelTokenSource = axios.CancelToken.source();
    const endpoint = `${config.method ?? "GET"} ${config.url}`;

    if (options?.useQueryRace !== false) {
      this._queryRace.apply(endpoint, source.cancel);
    }

    const promise = this._instance({
      ...config,
      ...options,
      cancelToken: source.token,
    }) as CancelablePromise<ApiResponse<R, ApiError>>;

    promise.finally(() => this._queryRace.delete(endpoint));
    promise.cancel = (message?: string) =>
      source.cancel(message ?? "Query was cancelled");

    return promise;
  }

  private _setupInterceptors(): void {
    this._instance.interceptors.request.use(async request => {
      await this._tokenSource.ensureFreshToken();

      if (this._tokenSource.accessToken) {
        request.headers.set(
          "Authorization",
          `Bearer ${this._tokenSource.accessToken}`,
        );
      }

      return request;
    });

    (this._instance.interceptors.response as any).use(
      (res: AxiosResponse): HttpClientResponse<any> => ({ data: res.data }),
      async (e: unknown): Promise<HttpClientResponse<any>> => {
        const error = ApiError.wrap(e);
        const status = error.response?.status || error.request?.status || 400;
        const config = error.config as RetryableConfig | undefined;

        if (status === 401 && config && !config._retry) {
          config._retry = true;

          const refreshed = await this._handleConcurrentRefresh();

          if (!refreshed) return { error };

          return this.request(config, {
            useQueryRace: false,
          }) as unknown as Promise<HttpClientResponse<any>>;
        }

        this._notifyError(error);

        return { error, isCanceled: e instanceof CanceledError };
      },
    );
  }

  /** Дедуплицирует concurrent refresh-запросы при 401 шторме. */
  private _handleConcurrentRefresh(): Promise<boolean> {
    if (!this._refreshPromise) {
      this._refreshPromise = this._tokenSource
        .refreshToken()
        .then(() => true)
        .catch(() => false)
        .finally(() => {
          this._refreshPromise = null;
        });
    }

    return this._refreshPromise;
  }

  private _notifyError(error: ApiError): void {
    if (error.isNetworkError) {
      this._notifications.error("Нет соединения с сервером", {
        duration: 6000,
      });
    } else if (error.isServerError) {
      this._notifications.error(error.message || "Внутренняя ошибка сервера");
    }
  }
}

export const axiosInstance = <R = any, P = any>(
  config: ApiRequestConfig<P>,
): CancelablePromise<ApiResponse<R, ApiError>> =>
  IHttpClient.getInstance().request<R, P>(config);
