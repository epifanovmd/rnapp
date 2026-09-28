import { BaseApi, IHttpClient } from "@shared/lib/http";

import type {
  DummyJsonAuthUser,
  DummyJsonCredentials,
  DummyJsonTokens,
  IDummyJsonAuthApi,
} from "./dummyjson.types";
import { createDummyJsonAuthClient } from "./dummyjson-http-client";

/**
 * Логин и обновление токенов. Ходит по клиенту без `bearerAuth`: иначе 401
 * самого обновления ушёл бы в новое обновление.
 */
export class DummyJsonAuthApi extends BaseApi implements IDummyJsonAuthApi {
  constructor(http: IHttpClient) {
    super(http);
  }

  login(credentials: DummyJsonCredentials) {
    return this.post<DummyJsonAuthUser, DummyJsonCredentials>(
      "/auth/login",
      credentials,
    );
  }

  refresh(refreshToken: string, expiresInMins?: number) {
    return this.post<DummyJsonTokens, Record<string, unknown>>(
      "/auth/refresh",
      { refreshToken, expiresInMins },
    );
  }
}

export const createDummyJsonAuthApi = (): IDummyJsonAuthApi =>
  new DummyJsonAuthApi(createDummyJsonAuthClient());
