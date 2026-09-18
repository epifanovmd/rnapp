import { ApiError, toApiError, toRequestInfo } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import type { HttpRequest, HttpResponse, RequestContext } from "../core/types";

type RequestTransform = (
  request: HttpRequest,
  ctx: RequestContext,
) => HttpRequest | void;

type ResponseTransform<TIn = unknown, TOut = unknown> = (
  response: HttpResponse<TIn>,
  ctx: RequestContext,
) => HttpResponse<TOut> | Promise<HttpResponse<TOut>>;

type ErrorTransform = (error: ApiError, ctx: RequestContext) => ApiError;

/** Правка запроса перед отправкой: вернуть новый объект или мутировать и ничего не вернуть. */
export const transformRequest = (
  transform: RequestTransform,
): HttpMiddleware => {
  return (ctx, next) => {
    ctx.request = transform(ctx.request, ctx) ?? ctx.request;

    return next();
  };
};

/** Правка ответа: распаковка envelope, парсинг дат, camelCase и т.п. */
export const transformResponse =
  <TIn = unknown, TOut = unknown>(
    transform: ResponseTransform<TIn, TOut>,
  ): HttpMiddleware =>
  async (ctx, next) =>
    transform((await next()) as HttpResponse<TIn>, ctx);

/** Правка ошибки: доменные сообщения, маппинг кодов бэкенда. Результат обязан быть `ApiError`. */
export const transformError = (transform: ErrorTransform): HttpMiddleware => {
  return async (ctx, next) => {
    try {
      return await next();
    } catch (error) {
      throw transform(toApiError(error, toRequestInfo(ctx.request)), ctx);
    }
  };
};
