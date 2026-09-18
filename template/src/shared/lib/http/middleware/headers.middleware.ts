import type { HttpMiddleware } from "../core/middleware";
import type { HttpHeaders, RequestContext } from "../core/types";

type HeadersSource = HttpHeaders | ((ctx: RequestContext) => HttpHeaders);

/** Добавляет заголовки: статичные или вычисляемые по запросу. */
export const withHeaders = (source: HeadersSource): HttpMiddleware => {
  return (ctx, next) => {
    const headers = typeof source === "function" ? source(ctx) : source;

    ctx.request.headers = { ...ctx.request.headers, ...headers };

    return next();
  };
};
