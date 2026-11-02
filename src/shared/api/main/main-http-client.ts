import { BASE_URL } from "@shared/config/env";
import {
  bearerAuth,
  createHttpClient,
  HttpClient,
  HttpTransport,
  notifyErrors,
  queryRace,
} from "@shared/lib/http";

import type { ApiClientDeps } from "../api.types";
import { deviceHeaders } from "./main-device";

export const MAIN_HTTP_TIMEOUT = 2 * 60 * 1000;

/**
 * Клиент основного бэкенда. `queryRace` нужен, потому что экраны
 * перезапрашивают одни эндпоинты и старый ответ не должен перетереть новый.
 */
export const createMainHttpClient = (
  deps: ApiClientDeps,
  transport?: HttpTransport,
): HttpClient =>
  createHttpClient(
    {
      baseUrl: BASE_URL,
      timeout: MAIN_HTTP_TIMEOUT,
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...deviceHeaders(),
      },
      middlewares: [
        notifyErrors(deps.notifications),
        queryRace(),
        bearerAuth(deps.session),
      ],
    },
    transport,
  );
