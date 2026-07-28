import { AxiosError, isAxiosError } from "axios";

type ApiErrorBody = {
  name?: string;
  message?: string;
  reason?: string;
};

export class ApiError extends AxiosError<ApiErrorBody> {
  static wrap(error: unknown): ApiError {
    if (isApiError(error)) {
      return error;
    }

    if (isAxiosError<ApiErrorBody>(error)) {
      return new ApiError(
        error.message,
        error.code,
        error.config,
        error.request,
        error.response,
      );
    }

    return new ApiError(
      error instanceof Error
        ? error.message
        : String(error ?? "Request failed"),
    );
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isServerError() {
    return (this.status ?? 0) >= 500;
  }
  get isNetworkError() {
    return this.code === AxiosError.ERR_NETWORK;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
