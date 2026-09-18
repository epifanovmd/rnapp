import type { ITokenSource } from "../contract";
import { isHttpError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — запрос без Authorization-заголовка и без refresh-retry по 401. */
    auth?: boolean;
  }
}

export interface BearerAuthOptions {
  header?: string;
  scheme?: string;
  /** По 401 один раз обновить токен и повторить запрос. */
  retryOnUnauthorized?: boolean;
}

/**
 * Подставляет access-токен и на 401 делает refresh + один повтор.
 * Параллельные 401 ждут один и тот же refresh. Ставить ниже `queryRace`,
 * чтобы повтор не считался новым запросом.
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
      // Токен не обновился заранее — запрос уйдёт с текущим, а 401 ниже решит, что делать.
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
