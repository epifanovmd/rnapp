import { createInjectDecorator } from "@shared/lib/di";
import { HttpError } from "@shared/lib/http";
import {
  ITokenSession,
  PersistentTokenStorage,
  refreshBeforeJwtExpiry,
  TokenSession,
} from "@shared/lib/session";
import type { IStorageService } from "@shared/lib/storage";

import type { IMainAuthApi } from "./main-auth.api";

/** DI-токен сессии основного бэкенда; её же получает сокет. */
export const IMainSession =
  createInjectDecorator<ITokenSession>("IMainSession");

const REFRESH_TOKEN_KEY = "app:refresh_token";

/** Запас до истечения access-токена, при котором пора обновляться. */
const REFRESH_BUFFER_SECONDS = 60;

/** Сессии нет, только если бэкенд ответил 4xx; сеть, таймаут, 5xx и 429 — временные. */
const isSessionRejected = (error: unknown): boolean =>
  error instanceof HttpError && error.status < 500 && error.status !== 429;

/**
 * Сессия основного бэкенда: refresh-токен переживает перезапуск, access — нет
 * и восстанавливается обновлением по `exp` JWT. Доменное состояние
 * авторизации живёт в `entities/auth`.
 */
export const createMainSession = (
  api: IMainAuthApi,
  storage: IStorageService,
): ITokenSession =>
  new TokenSession({
    storage: new PersistentTokenStorage(storage, { key: REFRESH_TOKEN_KEY }),
    shouldRefresh: refreshBeforeJwtExpiry(REFRESH_BUFFER_SECONDS),
    isSessionRejected,
    refresh: async refreshToken => {
      const { data, error } = await api.refresh(refreshToken);

      if (error) throw error;

      return data;
    },
  });
