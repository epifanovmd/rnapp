import type { HttpResponse, RequestContext } from "./types";

export type HttpNext = () => Promise<HttpResponse>;

/**
 * Onion-middleware: всё до `await next()` — обработка запроса, после — ответа,
 * `catch` вокруг `next()` — обработка ошибки. Повторный вызов `next()` заново
 * прогоняет только нижележащие middleware и транспорт (так устроен retry).
 */
export type HttpMiddleware = (
  ctx: RequestContext,
  next: HttpNext,
) => Promise<HttpResponse>;

export type HttpHandler = (ctx: RequestContext) => Promise<HttpResponse>;

export const composeMiddleware = (
  middlewares: readonly HttpMiddleware[],
  terminal: HttpHandler,
): HttpHandler => {
  return ctx => {
    const dispatch = async (index: number): Promise<HttpResponse> => {
      const middleware = middlewares[index];

      if (!middleware) return terminal(ctx);

      return middleware(ctx, () => dispatch(index + 1));
    };

    return dispatch(0);
  };
};
