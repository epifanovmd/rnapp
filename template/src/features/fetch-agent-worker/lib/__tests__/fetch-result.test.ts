import {
  fetchFailure,
  fetchSuccess,
  methodHasBody,
  prettyBody,
  routeMethod,
  workerRoutes,
} from "../fetch-result";

describe("worker fetch result", () => {
  it("тело: JSON — с отступами, текст — как есть", () => {
    expect(prettyBody('{"ok":true}')).toBe('{\n  "ok": true\n}');
    expect(prettyBody("pong")).toBe("pong");
    expect(prettyBody(undefined)).toBe("");
    expect(fetchSuccess('{"a":1}')).toEqual({
      ok: true,
      status: null,
      fromWorker: true,
      body: '{\n  "a": 1\n}',
    });
  });

  it("ответ воркера с ошибкой — по заголовку статуса воркера", () => {
    expect(
      fetchFailure({
        message: "Not Found",
        status: 404,
        headers: { "X-Agent-Worker-Status": "404" },
        body: '{"error":"нет"}',
      }),
    ).toEqual({
      ok: false,
      status: 404,
      fromWorker: true,
      body: '{\n  "error": "нет"\n}',
    });
  });

  it("ошибка API — без заголовка; тела нет — текст ошибки", () => {
    expect(
      fetchFailure({
        message: "Маршрут не объявлен",
        status: 400,
        headers: {},
      }),
    ).toEqual({
      ok: false,
      status: 400,
      fromWorker: false,
      body: "Маршрут не объявлен",
    });
  });

  it("маршруты и методы", () => {
    expect(workerRoutes(undefined)).toEqual([]);
    expect(routeMethod({ method: "post" })).toBe("POST");
    expect(routeMethod({ method: "OPTIONS" })).toBe("GET");
    expect(methodHasBody("GET")).toBe(false);
    expect(methodHasBody("PUT")).toBe(true);
  });
});
