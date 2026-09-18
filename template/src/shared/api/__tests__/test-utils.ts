import { HttpClient, HttpClientConfig } from "../core/http-client";
import type { HttpTransport } from "../core/transport";
import type { HttpRequest, HttpResponse } from "../core/types";

export type TransportHandler = (
  request: HttpRequest,
  signal: AbortSignal,
) => Promise<HttpResponse> | HttpResponse;

export interface FakeTransport extends HttpTransport {
  calls: HttpRequest[];
}

export const ok = <T>(data: T, status = 200): HttpResponse<T> => ({
  status,
  headers: {},
  data,
});

/** Транспорт-заглушка: записывает запросы и отвечает через handler. */
export const createFakeTransport = (
  handler: TransportHandler,
): FakeTransport => {
  const calls: HttpRequest[] = [];

  return {
    calls,
    async send(request, signal) {
      calls.push({ ...request, headers: { ...request.headers } });

      return handler(request, signal) as Promise<HttpResponse<any>>;
    },
  };
};

/** Транспорт, который «висит» до отмены сигнала. */
export const createHangingTransport = (): FakeTransport => {
  return createFakeTransport(
    (_, signal) =>
      new Promise((_resolve, reject) => {
        const abort = () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));

        if (signal.aborted) abort();
        signal.addEventListener("abort", abort);
      }),
  );
};

export const createClient = (
  transport: HttpTransport,
  config: Partial<HttpClientConfig> = {},
): HttpClient =>
  new HttpClient({ baseUrl: "https://api.test", ...config }, transport);

export const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0));
