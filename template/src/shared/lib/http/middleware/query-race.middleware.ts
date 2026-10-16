import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /**
     * `false` — не отменять предыдущий запрос на тот же ключ; `true` — отменять
     * при любом методе. По умолчанию гонка только для GET и HEAD.
     */
    queryRace?: boolean;
  }
}

export interface QueryRaceOptions {
  /** Ключ гонки; по умолчанию метод и URL без query-параметров. */
  key?: (ctx: RequestContext) => string;
}

/** Причина отмены, по которой видно, что запрос вытеснен более новым. */
export const QUERY_RACE_CANCEL_REASON = "Race condition canceled";

/** Методы чтения: их повтор безопасно гасить, изменения — нет. */
const RACE_METHODS = new Set(["GET", "HEAD"]);

const isRaced = (ctx: RequestContext): boolean =>
  ctx.options.queryRace ??
  RACE_METHODS.has((ctx.request.method ?? "GET").toUpperCase());

const defaultKey = (ctx: RequestContext): string =>
  `${ctx.request.method} ${ctx.request.baseUrl ?? ""}${ctx.request.url}`;

/**
 * Новый запрос отменяет предыдущий незавершённый с тем же ключом. Параметры в
 * ключ не входят, поэтому поиск по мере ввода гасит устаревшие запросы.
 * Изменяющие запросы (POST, PUT, …) участвуют только с `queryRace: true`.
 */
export const queryRace = (options: QueryRaceOptions = {}): HttpMiddleware => {
  const keyOf = options.key ?? defaultKey;
  const pending = new Map<string, () => void>();

  return async (ctx, next) => {
    if (!isRaced(ctx)) return next();

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
