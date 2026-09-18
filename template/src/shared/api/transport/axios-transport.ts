import axios, {
  AxiosError,
  AxiosInstance,
  isAxiosError,
  isCancel,
} from "axios";

import {
  ApiError,
  ApiRequestInfo,
  CanceledError,
  HttpError,
  NetworkError,
  TimeoutError,
  toApiError,
  toRequestInfo,
} from "../core/errors";
import type { HttpTransport } from "../core/transport";
import type { HttpHeaders, HttpRequest, HttpResponse } from "../core/types";

const TIMEOUT_CODES = new Set<string | undefined>([
  AxiosError.ECONNABORTED,
  AxiosError.ETIMEDOUT,
]);

/** Транспорт поверх axios. Инстанс без interceptors — вся логика живёт в middleware. */
export class AxiosTransport implements HttpTransport {
  constructor(private readonly _axios: AxiosInstance = axios.create()) {}

  async send<TData = unknown>(
    request: HttpRequest,
    signal: AbortSignal,
  ): Promise<HttpResponse<TData>> {
    try {
      const response = await this._axios.request<TData>({
        baseURL: request.baseUrl,
        url: request.url,
        method: request.method,
        params: request.params,
        data: request.data,
        headers: request.headers,
        timeout: request.timeout,
        responseType: request.responseType,
        withCredentials: request.withCredentials,
        signal,
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: normalizeHeaders(response.headers),
        data: response.data,
      };
    } catch (error) {
      throw axiosErrorToApiError(error, toRequestInfo(request));
    }
  }
}

export const axiosErrorToApiError = (
  error: unknown,
  request: ApiRequestInfo,
): ApiError => {
  if (isCancel(error)) {
    return new CanceledError(undefined, { request, cause: error });
  }

  if (!isAxiosError(error)) return toApiError(error, request);

  if (error.response) {
    return new HttpError({
      status: error.response.status,
      statusText: error.response.statusText,
      body: error.response.data,
      headers: normalizeHeaders(error.response.headers),
      request,
      cause: error,
    });
  }

  if (TIMEOUT_CODES.has(error.code)) {
    return new TimeoutError(error.message, { request, cause: error });
  }

  if (error.code === AxiosError.ERR_NETWORK || error.request) {
    return new NetworkError(error.message, { request, cause: error });
  }

  return toApiError(error, request);
};

const normalizeHeaders = (headers: unknown): HttpHeaders => {
  const raw =
    headers && typeof (headers as { toJSON?: unknown }).toJSON === "function"
      ? (headers as { toJSON(): Record<string, unknown> }).toJSON()
      : (headers as Record<string, unknown> | undefined);

  const result: HttpHeaders = {};

  for (const [key, value] of Object.entries(raw ?? {})) {
    if (value === undefined || value === null) continue;
    result[key.toLowerCase()] = Array.isArray(value)
      ? value.join(", ")
      : String(value);
  }

  return result;
};
