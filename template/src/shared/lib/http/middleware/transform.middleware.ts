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

/** Правит запрос перед отправкой: вернуть новый объект либо изменить текущий. */
export const transformRequest = (
  transform: RequestTransform,
): HttpMiddleware => {
  return (ctx, next) => {
    ctx.request = transform(ctx.request, ctx) ?? ctx.request;

    return next();
  };
};

/** Правит ответ: распаковка обёртки, разбор дат, переименование полей. */
export const transformResponse =
  <TIn = unknown, TOut = unknown>(
    transform: ResponseTransform<TIn, TOut>,
  ): HttpMiddleware =>
  async (ctx, next) =>
    transform((await next()) as HttpResponse<TIn>, ctx);

/** Правит ошибку: доменные сообщения и коды. Результат обязан быть `ApiError`. */
export const transformError = (transform: ErrorTransform): HttpMiddleware => {
  return async (ctx, next) => {
    try {
      return await next();
    } catch (error) {
      throw transform(toApiError(error, toRequestInfo(ctx.request)), ctx);
    }
  };
};
