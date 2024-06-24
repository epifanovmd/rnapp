import { iocDecorator } from "@force-dev/utils";
import { AxiosRequestConfig } from "axios";

export interface ApiAbortPromise<T> extends Promise<T> {
  abort: () => void;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  useRaceCondition?: boolean;
}

export const IApiService = iocDecorator<IApiService>();

export interface IApiService {
  onError(
    callback: (params: {
      status: number;
      error: Error;
      isCanceled: boolean;
    }) => void,
  ): void;

  get<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ): ApiAbortPromise<ApiResponse<R>>;

  post<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ): ApiAbortPromise<ApiResponse<R>>;

  patch<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ): ApiAbortPromise<ApiResponse<R>>;

  put<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ): ApiAbortPromise<ApiResponse<R>>;

  delete<R = any>(
    endpoint: string,
    config?: ApiRequestConfig,
  ): ApiAbortPromise<ApiResponse<R>>;
}

export interface ApiResponse<R> {
  data?: R;
  status: number;
  error?: Error;
}

export interface BaseRequest {
  skip?: number;
  limit?: number;
}

export interface BaseResponse {
  total: number;
  skip: number;
  limit: number;
}
