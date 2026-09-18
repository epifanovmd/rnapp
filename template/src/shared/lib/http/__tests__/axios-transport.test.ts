import axios, {
  AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  CanceledError as AxiosCanceled,
} from "axios";

import {
  CanceledError,
  HttpError,
  NetworkError,
  TimeoutError,
  UnknownApiError,
} from "../core/errors";
import {
  axiosErrorToApiError,
  AxiosTransport,
} from "../transport/axios-transport";

const info = { method: "GET", url: "/x" };

/** Как настоящий адаптер axios: не-2xx превращается в AxiosError с response. */
const adapterFor = (response: {
  status: number;
  statusText?: string;
  headers?: unknown;
  data?: unknown;
}) =>
  jest.fn(async (config: any) => {
    const full = { data: undefined, ...response, config };

    if (response.status >= 400) {
      throw new AxiosError("bad", "ERR_BAD_REQUEST", config, {}, full as any);
    }

    return full;
  }) as unknown as jest.Mock & AxiosAdapter;

describe("AxiosTransport", () => {
  it("маппит конфиг запроса и нормализует заголовки ответа", async () => {
    const adapter = adapterFor({
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders({ "X-Total": "3", ETag: "e" }),
      data: { ok: true },
    });
    const transport = new AxiosTransport(axios.create({ adapter }));
    const controller = new AbortController();

    const res = await transport.send(
      {
        url: "/items",
        method: "POST",
        baseUrl: "https://h",
        params: { a: 1 },
        data: { b: 2 },
        headers: { "X-Req": "1" },
        timeout: 5,
        responseType: "json",
        withCredentials: true,
      },
      controller.signal,
    );

    expect(res).toEqual({
      status: 200,
      statusText: "OK",
      headers: { "x-total": "3", etag: "e" },
      data: { ok: true },
    });
    const config = adapter.mock.calls[0][0];
    const {
      baseURL,
      url,
      method,
      params,
      data,
      timeout,
      responseType,
      withCredentials,
      signal,
    } = config;

    expect({
      baseURL,
      url,
      method,
      params,
      data,
      timeout,
      responseType,
      withCredentials,
    }).toEqual({
      baseURL: "https://h",
      url: "/items",
      method: "post",
      params: { a: 1 },
      data: '{"b":2}',
      timeout: 5,
      responseType: "json",
      withCredentials: true,
    });
    expect(signal).toBe(controller.signal);
    expect(config.headers.get("X-Req")).toBe("1");
  });

  it("не-2xx → HttpError с телом и заголовками", async () => {
    const adapter = adapterFor({
      status: 422,
      statusText: "Unprocessable",
      headers: { "content-type": "application/json" },
      data: { message: "invalid", name: "ValidationError" },
    });
    const transport = new AxiosTransport(axios.create({ adapter }));

    await expect(
      transport.send({ url: "/v" }, new AbortController().signal),
    ).rejects.toMatchObject({
      kind: "http",
      status: 422,
      message: "invalid",
      code: "ValidationError",
      headers: { "content-type": "application/json" },
      request: { method: "GET", url: "/v" },
    });
  });

  it("axiosErrorToApiError: cancel, timeout, network, unknown", () => {
    const timeout = new AxiosError("timeout", AxiosError.ECONNABORTED);
    const timedOut = new AxiosError("timeout", AxiosError.ETIMEDOUT);
    const network = new AxiosError("net", AxiosError.ERR_NETWORK);
    const noResponse = Object.assign(new AxiosError("sent"), { request: {} });
    const weird = new AxiosError("weird", "ERR_BAD_OPTION");

    expect(axiosErrorToApiError(new AxiosCanceled(), info)).toBeInstanceOf(
      CanceledError,
    );
    expect(axiosErrorToApiError(timeout, info)).toBeInstanceOf(TimeoutError);
    expect(axiosErrorToApiError(timedOut, info)).toBeInstanceOf(TimeoutError);
    expect(axiosErrorToApiError(network, info)).toBeInstanceOf(NetworkError);
    expect(axiosErrorToApiError(noResponse, info)).toBeInstanceOf(NetworkError);
    expect(axiosErrorToApiError(weird, info)).toBeInstanceOf(UnknownApiError);
    expect(axiosErrorToApiError(new Error("plain"), info)).toBeInstanceOf(
      UnknownApiError,
    );
    expect(axiosErrorToApiError(weird, info).request).toBe(info);
    expect(axiosErrorToApiError(network, info).cause).toBe(network);
  });

  it("реальный abort через signal → CanceledError", async () => {
    const adapter: AxiosAdapter = config =>
      new Promise((_resolve, reject) => {
        (config.signal as AbortSignal).addEventListener("abort", () =>
          reject(new AxiosCanceled("canceled", config)),
        );
      });
    const transport = new AxiosTransport(axios.create({ adapter }));
    const controller = new AbortController();
    const pending = transport.send({ url: "/slow" }, controller.signal);

    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(CanceledError);
  });

  it("HttpError из ответа с массивом в заголовке", () => {
    const error = new AxiosError(
      "bad",
      "ERR_BAD_RESPONSE",
      undefined,
      {},
      {
        status: 500,
        statusText: "",
        headers: { "set-cookie": ["a=1", "b=2"], empty: undefined } as any,
        data: null,
        config: {} as any,
      },
    );
    const mapped = axiosErrorToApiError(error, info) as HttpError;

    expect(mapped.headers).toEqual({ "set-cookie": "a=1, b=2" });
    expect(mapped.message).toBe("Request failed with status 500");
  });
});

describe("AxiosTransport: прогресс", () => {
  it("нормализует событие axios и не ставит колбэк без слушателя", async () => {
    const adapter = adapterFor({ status: 200, data: null });
    const transport = new AxiosTransport(axios.create({ adapter }));
    const onUploadProgress = jest.fn();

    await transport.send(
      { url: "/a", method: "POST", onUploadProgress },
      new AbortController().signal,
    );
    await transport.send({ url: "/b" }, new AbortController().signal);

    const withListener = adapter.mock.calls[0][0];
    const without = adapter.mock.calls[1][0];

    withListener.onUploadProgress({ loaded: 50, total: 200, progress: 0.25 });

    expect(onUploadProgress).toHaveBeenCalledWith({
      loaded: 50,
      total: 200,
      ratio: 0.25,
    });
    expect(without.onUploadProgress).toBeUndefined();
    expect(without.onDownloadProgress).toBeUndefined();
  });
});
