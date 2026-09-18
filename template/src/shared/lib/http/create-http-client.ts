import { HttpClient, HttpClientConfig } from "./core/http-client";
import type { HttpTransport } from "./core/transport";
import { AxiosTransport } from "./transport/axios-transport";

/** Сборка клиента; транспорт по умолчанию — axios. */
export const createHttpClient = (
  config: HttpClientConfig,
  transport: HttpTransport = new AxiosTransport(),
): HttpClient => new HttpClient(config, transport);
