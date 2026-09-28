import {
  CanceledError,
  getErrorBody,
  HttpError,
  isApiError,
  isCanceledError,
  isHttpError,
  isNetworkError,
  isTimeoutError,
  NetworkError,
  resolveHttpErrorMessage,
  TimeoutError,
  toApiError,
  toRequestInfo,
  UnknownApiError,
} from "../core/errors";

describe("ApiError", () => {
  it("HttpError: статус, флаги, сообщение и code из тела", () => {
    const error = new HttpError({
      status: 404,
      body: { name: "NotFound", message: "Нет такого" },
      request: { method: "GET", url: "/x" },
    });

    expect(error.kind).toBe("http");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Нет такого");
    expect(error.code).toBe("NotFound");
    expect(error.name).toBe("HttpError");
    expect(error.isNotFound).toBe(true);
    expect(error.isClientError).toBe(true);
    expect(error.isServerError).toBe(false);
    expect(error.isHttpError).toBe(true);
    expect(error.request).toEqual({ method: "GET", url: "/x" });
    expect(error).toBeInstanceOf(Error);
  });

  it("HttpError без code в теле — code = статус", () => {
    const error = new HttpError({ status: 500, body: "boom" });

    expect(error.code).toBe("500");
    expect(error.message).toBe("boom");
    expect(error.isServerError).toBe(true);
    expect(error.isUnauthorized).toBe(false);
  });

  it("явное message имеет приоритет над телом", () => {
    const error = new HttpError({
      status: 400,
      body: { message: "server" },
      message: "custom",
    });

    expect(error.message).toBe("custom");
  });

  it("resolveHttpErrorMessage: строка, поля тела, fallback по статусу", () => {
    expect(resolveHttpErrorMessage("plain", 400)).toBe("plain");
    expect(resolveHttpErrorMessage({ reason: "r" }, 400)).toBe("r");
    expect(resolveHttpErrorMessage({ error: "e" }, 400)).toBe("e");
    expect(resolveHttpErrorMessage({ detail: "d" }, 400)).toBe("d");
    expect(resolveHttpErrorMessage({ message: "" }, 400)).toBe(
      "Request failed with status 400",
    );
    expect(resolveHttpErrorMessage([1], 502, "Bad Gateway")).toBe(
      "Request failed with status 502 (Bad Gateway)",
    );
    expect(resolveHttpErrorMessage(null, 503)).toBe(
      "Request failed with status 503",
    );
  });

  it("не-HTTP ошибки: status undefined, флаги по kind", () => {
    const network = new NetworkError();
    const timeout = new TimeoutError();
    const canceled = new CanceledError();
    const unknown = new UnknownApiError();

    expect(network.status).toBeUndefined();
    expect(network.isNetworkError).toBe(true);
    expect(network.isServerError).toBe(false);
    expect(network.code).toBe("network");
    expect(timeout.isTimeout).toBe(true);
    expect(canceled.isCanceled).toBe(true);
    expect(canceled.isClientError).toBe(false);
    expect(unknown.kind).toBe("unknown");
    expect(unknown.message).toBe("Request failed");
  });

  it("guards", () => {
    expect(isApiError(new NetworkError())).toBe(true);
    expect(isApiError(new Error())).toBe(false);
    expect(isHttpError(new HttpError({ status: 400 }))).toBe(true);
    expect(isHttpError(new NetworkError())).toBe(false);
    expect(isCanceledError(new CanceledError())).toBe(true);
    expect(isNetworkError(new NetworkError())).toBe(true);
    expect(isTimeoutError(new TimeoutError())).toBe(true);
    expect(isTimeoutError(new NetworkError())).toBe(false);
  });

  it("toApiError: ApiError как есть, AbortError → CanceledError, остальное → Unknown с cause", () => {
    const api = new NetworkError();
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    const plain = new Error("oops");

    expect(toApiError(api)).toBe(api);
    expect(toApiError(abort)).toBeInstanceOf(CanceledError);
    expect(toApiError(abort).cause).toBe(abort);

    const unknown = toApiError(plain, { method: "GET", url: "/u" });

    expect(unknown).toBeInstanceOf(UnknownApiError);
    expect(unknown.message).toBe("oops");
    expect(unknown.cause).toBe(plain);
    expect(unknown.request).toEqual({ method: "GET", url: "/u" });
    expect(toApiError("text").message).toBe("text");
    expect(toApiError(42).message).toBe("Request failed");
    expect(toApiError(null).cause).toBeNull();
  });

  it("getErrorBody достаёт тело только у HTTP-ошибки", () => {
    type Body = { code: string; fields: string[] };

    const http = new HttpError({
      status: 422,
      body: { code: "validation", fields: ["email"] },
    });

    expect(getErrorBody<Body>(http)?.fields).toEqual(["email"]);
    expect(getErrorBody(new NetworkError())).toBeUndefined();
    expect(getErrorBody(new CanceledError())).toBeUndefined();
    expect(getErrorBody(new Error("plain"))).toBeUndefined();
    expect(getErrorBody(new HttpError({ status: 204 }))).toBeUndefined();
  });

  it("toRequestInfo склеивает baseUrl и url, метод в верхнем регистре", () => {
    expect(
      toRequestInfo({ url: "/a", method: "post", baseUrl: "http://h" }),
    ).toEqual({
      method: "POST",
      url: "http://h/a",
    });
    expect(toRequestInfo({ url: "/a" })).toEqual({ method: "GET", url: "/a" });
  });
});
