import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — не отменять предыдущий запрос на тот же эндпоинт. */
    queryRace?: boolean;
  }
}

export interface QueryRaceOptions {
  /** Ключ гонки; по умолчанию `METHOD baseUrl/url` без query-параметров. */
  key?: (ctx: RequestContext) => string;
}

export const QUERY_RACE_CANCEL_REASON = "Race condition canceled";

const defaultKey = (ctx: RequestContext): string =>
  `${ctx.request.method} ${ctx.request.baseUrl ?? ""}${ctx.request.url}`;

/** Новый запрос на тот же эндпоинт отменяет предыдущий незавершённый. */
export const queryRace = (options: QueryRaceOptions = {}): HttpMiddleware => {
  const keyOf = options.key ?? defaultKey;
  const pending = new Map<string, () => void>();

  return async (ctx, next) => {
    if (ctx.options.queryRace === false) return next();

    const key = keyOf(ctx);
    const cancel = () => ctx.cancel(QUERY_RACE_CANCEL_REASON);

    pending.get(key)?.();
    pending.set(key, cancel);

    try {
      return await next();
    } finally {
      if (pending.get(key) === cancel) pending.delete(key);
    }
  };
};
