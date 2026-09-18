import { BASE_URL } from "@shared/config/env";
import { createInjectDecorator } from "@shared/lib/di";
import {
  ApiResponse,
  BaseApi,
  CancelablePromise,
  createHttpClient,
  HttpTransport,
  IHttpClient,
} from "@shared/lib/http";
import type { TokenPair } from "@shared/lib/session";

export const IMainAuthApi = createInjectDecorator<IMainAuthApi>("IMainAuthApi");

export interface IMainAuthApi {
  refresh(refreshToken: string): CancelablePromise<ApiResponse<TokenPair>>;
}

const REFRESH_TIMEOUT = 10_000;

/**
 * Обновление токенов. Написан руками, потому что ходит по клиенту без
 * `bearerAuth`: иначе 401 самого обновления ушёл бы в новое обновление.
 * Тостов тоже нет — конец сессии показывает экран.
 */
export class MainAuthApi extends BaseApi implements IMainAuthApi {
  constructor(http: IHttpClient) {
    super(http);
  }

  refresh(refreshToken: string) {
    return this.post<TokenPair, { refreshToken: string }>("/api/auth/refresh", {
      refreshToken,
    });
  }
}

/** Клиент без авторизации и тостов; по нему ходит только обновление токенов. */
export const createMainAuthClient = (transport?: HttpTransport): IHttpClient =>
  createHttpClient(
    { baseUrl: BASE_URL, timeout: REFRESH_TIMEOUT, withCredentials: true },
    transport,
  );

export const createMainAuthApi = (): IMainAuthApi =>
  new MainAuthApi(createMainAuthClient());
