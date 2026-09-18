import { BASE_URL } from "@shared/config/env";
import type { INotificationService } from "@shared/lib/notifications";

import type { ITokenSource } from "../contract";
import type { HttpClient } from "../core/http-client";
import { createHttpClient } from "../create-http-client";
import { bearerAuth } from "../middleware/bearer-auth.middleware";
import { notifyErrors } from "../middleware/notify-errors.middleware";
import { queryRace } from "../middleware/query-race.middleware";

export interface MainHttpClientDeps {
  tokenSource: ITokenSource;
  notifications: INotificationService;
}

export const MAIN_HTTP_TIMEOUT = 2 * 60 * 1000;

/** Сборка клиента основного бэкенда. Чистая функция — зависимости приходят из DI-модуля. */
export const createMainHttpClient = (deps: MainHttpClientDeps): HttpClient =>
  createHttpClient({
    baseUrl: BASE_URL,
    timeout: MAIN_HTTP_TIMEOUT,
    withCredentials: true,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    middlewares: [
      notifyErrors(deps.notifications),
      queryRace(),
      bearerAuth(deps.tokenSource),
    ],
  });
