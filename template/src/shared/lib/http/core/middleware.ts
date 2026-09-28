import type { HttpResponse, RequestContext } from "./types";

export type HttpNext = () => Promise<HttpResponse>;

/**
 * Слой пайплайна: до `await next()` правит запрос, после — ответ, в `catch` —
 * ошибку. Повторный `next()` перезапускает только нижние слои и транспорт.
 */
export type HttpMiddleware = (
  ctx: RequestContext,
  next: HttpNext,
) => Promise<HttpResponse>;

export type HttpHandler = (ctx: RequestContext) => Promise<HttpResponse>;

/** Собирает слои в одну функцию; первый в списке — самый внешний. */
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
