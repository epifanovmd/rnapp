import type { INotificationService } from "@shared/lib/notifications";

import { toApiError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — не показывать тост об ошибке этого запроса. */
    notifyErrors?: boolean;
  }
}

export interface NotifyErrorsOptions {
  networkMessage?: string;
  serverMessage?: string;
}

/**
 * Тосты для ошибок, на которые экран обычно не реагирует сам: нет сети,
 * таймаут, 5xx. Ставить самым внешним, чтобы видеть итог после retry.
 * Одинаковые ошибки схлопываются в один тост по `key`.
 */
export const notifyErrors = (
  notifications: INotificationService,
  options: NotifyErrorsOptions = {},
): HttpMiddleware => {
  const {
    networkMessage = "Нет соединения с сервером",
    serverMessage = "Внутренняя ошибка сервера",
  } = options;

  return async (ctx, next) => {
    if (ctx.options.notifyErrors === false) return next();

    try {
      return await next();
    } catch (raw) {
      const error = toApiError(raw);

      if (error.isNetworkError || error.isTimeout) {
        notifications.error(networkMessage, {
          duration: 6000,
          key: "http:network-error",
        });
      } else if (error.isServerError) {
        notifications.error(error.message || serverMessage, {
          key: "http:server-error",
        });
      }

      throw raw;
    }
  };
};
