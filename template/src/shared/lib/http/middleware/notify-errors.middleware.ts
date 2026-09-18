import type { INotificationService } from "@shared/lib/notifications";

import { toApiError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — молча, без тоста. */
    notifyErrors?: boolean;
  }
}

export interface NotifyErrorsOptions {
  networkMessage?: string;
  serverMessage?: string;
}

/**
 * Тост на ошибки, которые экран обычно не обрабатывает сам: нет сети, таймаут,
 * 5xx. Ставится самым внешним, чтобы видеть итог после повторов; одинаковые
 * ошибки схлопываются в один тост.
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
