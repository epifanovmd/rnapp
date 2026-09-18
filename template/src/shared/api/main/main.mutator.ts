import type {
  ApiResponse,
  CancelablePromise,
  HttpRequest,
  RequestOptions,
} from "@shared/lib/http";

import { IMainHttpClient } from "./main.types";

/**
 * Адаптер orval: сгенерированный клиент зовёт `mainMutator`, тот берёт
 * HTTP-клиент из DI. Резолв только внутри вызова — на момент импорта
 * контейнер ещё пуст.
 *
 * Сигнатуру orval читает статически: два параметра здесь дают каждому
 * сгенерированному методу per-call аргумент `options`.
 */
export const mainMutator = <TData = unknown, TBody = unknown>(
  request: HttpRequest<TBody>,
  options?: RequestOptions,
): CancelablePromise<ApiResponse<TData>> =>
  IMainHttpClient.getInstance().request<TData, TBody>(request, options);
