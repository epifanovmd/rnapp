import type { IInjectDecorator } from "@shared/lib/di";

import type { CancelablePromise } from "./core/cancelable";
import { HttpClient, HttpClientConfig, IHttpClient } from "./core/http-client";
import type { HttpTransport } from "./core/transport";
import type { ApiResponse, HttpRequest, RequestOptions } from "./core/types";
import { AxiosTransport } from "./transport/axios-transport";

/** Единственная точка сборки клиента: транспорт по умолчанию — axios. */
export const createHttpClient = (
  config: HttpClientConfig,
  transport: HttpTransport = new AxiosTransport(),
): HttpClient => new HttpClient(config, transport);

/**
 * Мутатор для orval по DI-токену клиента: в `orval.config.ts` указывается
 * `<name>Mutator`, а клиент резолвится лениво — на момент импорта контейнер пуст.
 */
export const createApiMutator =
  (token: IInjectDecorator<IHttpClient>) =>
  <TData = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
    options?: RequestOptions,
  ): CancelablePromise<ApiResponse<TData>> =>
    token.getInstance().request<TData, TBody>(request, options);
