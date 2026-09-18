import { createInjectDecorator } from "@shared/lib/di";

import type { IHttpClient } from "../core/http-client";
import type { getRestApi } from "../gen/main/api";

/** HTTP-клиент основного бэкенда: bearer-auth, query-race, тосты об ошибках. */
export const IMainHttpClient =
  createInjectDecorator<IHttpClient>("IMainHttpClient");

/** Сгенерированный orval клиент основного бэкенда. */
export type IMainApi = ReturnType<typeof getRestApi>;
export const IMainApi = createInjectDecorator<IMainApi>("IMainApi");
