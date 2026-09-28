import type { ITokenSource } from "../contract";
import { isHttpError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — без токена и без повтора по 401. */
    auth?: boolean;
  }
}

export interface BearerAuthOptions {
  header?: string;
  scheme?: string;
  /** Обновлять токен и повторять запрос при 401. По умолчанию да. */
  retryOnUnauthorized?: boolean;
}

/**
 * Подставляет access-токен, а на 401 обновляет его и повторяет запрос один раз.
 * Параллельные 401 ждут одно обновление. Ставится ниже `queryRace`, иначе
 * повтор считался бы новым участником гонки.
 */
export const bearerAuth = (
  tokenSource: ITokenSource,
  options: BearerAuthOptions = {},
): HttpMiddleware => {
  const {
    header = "Authorization",
    scheme = "Bearer",
    retryOnUnauthorized = true,
  } = options;

  let refreshing: Promise<boolean> | null = null;

  /** Одно обновление на все параллельные 401. */
  const refreshOnce = (): Promise<boolean> => {
    if (!refreshing) {
      refreshing = tokenSource
        .refreshToken()
        .then(
          () => true,
          () => false,
        )
        .finally(() => {
          refreshing = null;
        });
    }

    return refreshing;
  };

  /** Пишет заголовок авторизации, если токен есть. */
  const applyToken = (ctx: RequestContext): void => {
    const token = tokenSource.accessToken;

    if (!token) return;

    ctx.request.headers = {
      ...ctx.request.headers,
      [header]: `${scheme} ${token}`,
    };
  };

  return async (ctx, next) => {
    if (ctx.options.auth === false) return next();

    try {
      await tokenSource.ensureFreshToken();
    } catch {
      // Упреждающее обновление не удалось: пробуем с текущим токеном, 401 разберётся.
    }

    applyToken(ctx);

    try {
      return await next();
    } catch (error) {
      const shouldRetry =
        retryOnUnauthorized &&
        isHttpError(error) &&
        error.status === 401 &&
        !ctx.signal.aborted;

      if (!shouldRetry || !(await refreshOnce())) throw error;

      applyToken(ctx);

      return next();
    }
  };
};
