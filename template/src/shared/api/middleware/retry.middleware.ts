import { ApiError, toApiError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import type { RequestContext } from "../core/types";

declare module "../core/types" {
  interface RequestOptions {
    /** `false` — не повторять этот запрос; число — своё количество повторов. */
    retry?: boolean | number;
  }
}

export interface RetryOptions {
  /** Количество повторов сверх первой попытки. */
  attempts?: number;
  /** Пауза перед повтором; по умолчанию экспоненциальная 300ms * 2^n. */
  delay?: (attempt: number) => number;
  /** Что повторять; по умолчанию сеть, таймаут и 5xx у идемпотентных методов. */
  shouldRetry?: (error: ApiError, ctx: RequestContext) => boolean;
}

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

const defaultShouldRetry = (error: ApiError, ctx: RequestContext): boolean =>
  IDEMPOTENT_METHODS.has(ctx.request.method?.toUpperCase() ?? "GET") &&
  (error.isNetworkError || error.isTimeout || error.isServerError);

const defaultDelay = (attempt: number): number => 300 * 2 ** attempt;

/**
 * Повтор временных сбоев. Отмена прерывает и ожидание, и цикл, поэтому
 * отменённый запрос не «оживает» повтором.
 */
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

const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    let timer: ReturnType<typeof setTimeout>;

    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };

    timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
  });
