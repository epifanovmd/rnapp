import { HttpExceptionReason } from "@force-dev/utils";

export type ApiRequest<T extends object = {}> = T & {
  skip?: number;
  limit?: number;
};

export interface BaseResponse {
  total: number;
  skip: number;
  limit: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly reason?: HttpExceptionReason;

  constructor(
    name: string,
    message: string,
    status: number,
    reason?: HttpExceptionReason,
  ) {
    super();

    this.name = name;
    this.message = message;
    this.status = status;
    this.reason = reason;
  }
}
