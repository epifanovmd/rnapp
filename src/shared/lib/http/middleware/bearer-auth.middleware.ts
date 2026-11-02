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
 * Параллельные 401 ждут одно обновление; запоздавший 401 со старым токеном
 * повторяется с текущим без обновления. Ставится ниже `queryRace`, иначе
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

  /** Пишет заголовок авторизации, если токен есть; возвращает подставленный токен. */
  const applyToken = (ctx: RequestContext): string => {
    const token = tokenSource.accessToken;

    if (!token) return token;

    ctx.request.headers = {
      ...ctx.request.headers,
      [header]: `${scheme} ${token}`,
    };

    return token;
  };

  return async (ctx, next) => {
    if (ctx.options.auth === false) return next();

    try {
      await tokenSource.ensureFreshToken();
    } catch {
      // Упреждающее обновление не удалось: пробуем с текущим токеном, 401 разберётся.
    }

    const sentToken = applyToken(ctx);

    try {
      return await next();
    } catch (error) {
      const shouldRetry =
        retryOnUnauthorized &&
        isHttpError(error) &&
        error.status === 401 &&
        !ctx.signal.aborted;

      if (!shouldRetry) throw error;

      // Запрос ушёл со старым токеном, а его уже обновили: повторить без refresh.
      const current = tokenSource.accessToken;
      const isStale = !!sentToken && !!current && current !== sentToken;

      if (!isStale && !(await refreshOnce())) throw error;

      applyToken(ctx);

      return next();
    }
  };
};
