import type { AxiosRequestConfig } from "axios";

export interface ApiRequestConfig<P = any> extends Partial<
  AxiosRequestConfig<P>
> {
  useQueryRace?: boolean;
}

export type ApiResponse<R, E = unknown> =
  { data: R; error?: undefined } | { data?: undefined; error: E };

export interface CancelablePromise<T> extends Promise<T> {
  cancel: (message?: string) => void;
}
