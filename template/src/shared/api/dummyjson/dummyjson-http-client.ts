import {
  bearerAuth,
  createHttpClient,
  HttpClient,
  HttpTransport,
  notifyErrors,
  retry,
} from "@shared/lib/http";

import type { ApiClientDeps } from "../api.types";

/** URL один для всех стендов, поэтому константа, а не `config/env`. */
export const DUMMYJSON_BASE_URL = "https://dummyjson.com";

const DUMMYJSON_TIMEOUT = 30_000;

const baseConfig = {
  baseUrl: DUMMYJSON_BASE_URL,
  timeout: DUMMYJSON_TIMEOUT,
  headers: { "Content-Type": "application/json" },
};

/** Клиент логина и обновления: без авторизации и тостов, ошибки показывает экран. */
export const createDummyJsonAuthClient = (
  transport?: HttpTransport,
): HttpClient => createHttpClient(baseConfig, transport);

/**
 * Клиент DummyJSON. `retry` нужен, потому что это публичный сервис в
 * интернете; `queryRace` не нужен — экранов с гонкой запросов нет.
 */
export const createDummyJsonHttpClient = (
  deps: ApiClientDeps,
  transport?: HttpTransport,
): HttpClient =>
  createHttpClient(
    {
      ...baseConfig,
      middlewares: [
        notifyErrors(deps.notifications),
        retry(),
        bearerAuth(deps.session),
      ],
    },
    transport,
  );
