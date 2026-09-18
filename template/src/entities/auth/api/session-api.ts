import {
  ApiResponse,
  BaseApi,
  CancelablePromise,
  createHttpClient,
  IHttpClient,
} from "@shared/api";
import { BASE_URL } from "@shared/config/env";
import { createInjectDecorator } from "@shared/lib/di";

import { RefreshResponse } from "./types";

export const IAuthSessionApi =
  createInjectDecorator<IAuthSessionApi>("IAuthSessionApi");

export interface IAuthSessionApi {
  refresh(
    refreshToken: string,
  ): CancelablePromise<ApiResponse<RefreshResponse>>;
}

const REFRESH_TIMEOUT = 10_000;

/**
 * Рукописный API сессии. Живёт на отдельном клиенте без bearer-auth:
 * refresh не должен сам уходить в refresh по 401 и показывать тосты.
 */
export class AuthSessionApi extends BaseApi implements IAuthSessionApi {
  constructor(http: IHttpClient) {
    super(http);
  }

  refresh(refreshToken: string) {
    return this.post<RefreshResponse, { refreshToken: string }>(
      "/api/auth/refresh",
      { refreshToken },
    );
  }
}

export const createAuthSessionApi = (): IAuthSessionApi =>
  new AuthSessionApi(
    createHttpClient({
      baseUrl: BASE_URL,
      timeout: REFRESH_TIMEOUT,
      withCredentials: true,
    }),
  );
