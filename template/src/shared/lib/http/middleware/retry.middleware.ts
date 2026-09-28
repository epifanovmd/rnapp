import { ApiError, toApiError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — без повторов; число — свой лимит. */
    retry?: boolean | number;
  }
}

export interface RetryOptions {
  /** Повторов сверх первой попытки. */
  attempts?: number;
  /** Пауза перед повтором; по умолчанию 300мс с удвоением. */
  delay?: (attempt: number) => number;
  /** Что повторять; по умолчанию сеть, таймаут и 5xx у идемпотентных методов. */
  shouldRetry?: (error: ApiError, ctx: RequestContext) => boolean;
}

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

const defaultShouldRetry = (error: ApiError, ctx: RequestContext): boolean =>
  IDEMPOTENT_METHODS.has(ctx.request.method?.toUpperCase() ?? "GET") &&
  (error.isNetworkError || error.isTimeout || error.isServerError);

const defaultDelay = (attempt: number): number => 300 * 2 ** attempt;

/** Повторяет временные сбои. Отмена прерывает и паузу, и сам цикл. */
export const retry = (options: RetryOptions = {}): HttpMiddleware => {
  const {
    attempts = 2,
    delay = defaultDelay,
    shouldRetry = defaultShouldRetry,
  } = options;

  return async (ctx, next) => {
    const limit = resolveLimit(ctx.options.retry, attempts);

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await next();
      } catch (raw) {
        const error = toApiError(raw);
        const canRetry =
          attempt < limit &&
          !ctx.signal.aborted &&
          !error.isCanceled &&
          shouldRetry(error, ctx);

        if (!canRetry) throw raw;

        await wait(delay(attempt), ctx.signal);

        // Пауза прервалась отменой — повтор уже не нужен.
        if (ctx.signal.aborted) throw raw;
      }
    }
  };
};

const resolveLimit = (
  option: boolean | number | undefined,
  fallback: number,
): number => {
  if (option === false) return 0;
  if (typeof option === "number") return Math.max(0, option);

  return fallback;
};

/** Пауза, которую прерывает отмена запроса. */
const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    const timer = setTimeout(resolve, ms);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
