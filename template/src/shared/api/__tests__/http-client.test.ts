import { CanceledError, HttpError, UnknownApiError } from "../core/errors";
import type { HttpMiddleware } from "../core/middleware";
import {
  createClient,
  createFakeTransport,
  createHangingTransport,
  flush,
  ok,
} from "./test-utils";

describe("HttpClient", () => {
  it("request: нормализует запрос (метод, baseUrl, заголовки, timeout) и отдаёт data", async () => {
    const transport = createFakeTransport(() => ok({ id: 1 }));
    const client = createClient(transport, {
      headers: { Accept: "application/json" },
      timeout: 1000,
      withCredentials: true,
    });

    const res = await client.request<{ id: number }>({
      url: "/users",
      method: "post",
      headers: { "X-Req": "1" },
    });

    expect(res).toEqual({ data: { id: 1 } });
    expect(transport.calls[0]).toMatchObject({
      url: "/users",
      method: "POST",
      baseUrl: "https://api.test",
      headers: { Accept: "application/json", "X-Req": "1" },
      timeout: 1000,
      withCredentials: true,
    });
    expect(transport.calls[0].params).toBeUndefined();
  });

  it("baseUrl-геттер читается на каждый запрос", async () => {
    let base = "https://one";
    const transport = createFakeTransport(() => ok(null));
    const client = createClient(transport, { baseUrl: () => base });

    await client.request({ url: "/a" });
    base = "https://two";
    await client.request({ url: "/a" });

    expect(transport.calls.map(c => c.baseUrl)).toEqual([
      "https://one",
      "https://two",
    ]);
  });

  it("per-call options перекрывают запрос и конфиг", async () => {
    const transport = createFakeTransport(() => ok(null));
    const client = createClient(transport, {
      headers: { A: "cfg", B: "cfg" },
      timeout: 1,
    });

    await client.request(
      { url: "/a", headers: { B: "req" }, params: { p: 1 }, timeout: 2 },
      {
        headers: { B: "opt" },
        params: { q: 2 },
        timeout: 3,
        baseUrl: "https://other",
        responseType: "blob",
      },
    );

    expect(transport.calls[0]).toMatchObject({
      baseUrl: "https://other",
      headers: { A: "cfg", B: "opt" },
      params: { p: 1, q: 2 },
      timeout: 3,
      responseType: "blob",
    });
  });

  it("request: ошибка транспорта приходит в error, промис не реджектится", async () => {
    const transport = createFakeTransport(() => {
      throw new HttpError({ status: 500, body: { message: "down" } });
    });
    const res = await createClient(transport).request({ url: "/a" });

    expect(res.data).toBeUndefined();
    expect(res.error).toBeInstanceOf(HttpError);
    expect(res.error?.message).toBe("down");
    expect(res.error?.isServerError).toBe(true);
  });

  it("request: чужое исключение из middleware заворачивается в UnknownApiError с request info", async () => {
    const broken: HttpMiddleware = () => {
      throw new TypeError("bug");
    };
    const client = createClient(
      createFakeTransport(() => ok(null)),
      {
        middlewares: [broken],
      },
    );
    const res = await client.request({ url: "/bug", method: "delete" });

    expect(res.error).toBeInstanceOf(UnknownApiError);
    expect(res.error?.message).toBe("bug");
    expect(res.error?.request).toEqual({
      method: "DELETE",
      url: "https://api.test/bug",
    });
  });

  it("send: полный ответ, реджект ApiError", async () => {
    const transport = createFakeTransport(() => ({
      status: 201,
      headers: { etag: "x" },
      data: "body",
    }));
    const client = createClient(transport);

    await expect(client.send({ url: "/a" })).resolves.toEqual({
      status: 201,
      headers: { etag: "x" },
      data: "body",
    });

    const failing = createClient(
      createFakeTransport(() => {
        throw new HttpError({ status: 403 });
      }),
    );

    await expect(failing.send({ url: "/a" })).rejects.toBeInstanceOf(HttpError);
  });

  it("cancel: сигнал абортится, результат — CanceledError с причиной", async () => {
    const transport = createHangingTransport();
    const pending = createClient(transport).request({ url: "/slow" });

    pending.cancel("user left");

    const res = await pending;

    expect(res.error).toBeInstanceOf(CanceledError);
    expect(res.error?.isCanceled).toBe(true);
    expect(res.error?.message).toBe("user left");
  });

  it("cancel без причины — дефолтное сообщение; повторный cancel игнорируется", async () => {
    const pending = createClient(createHangingTransport()).send({ url: "/s" });

    pending.cancel();
    pending.cancel("second");

    await expect(pending).rejects.toMatchObject({
      kind: "canceled",
      message: "Request canceled",
    });
  });

  it("любая ошибка после аборта трактуется как отмена", async () => {
    const transport = createFakeTransport(
      (_, signal) =>
        new Promise((_r, reject) =>
          signal.addEventListener("abort", () => reject(new Error("socket"))),
        ),
    );
    const pending = createClient(transport).request({ url: "/a" });

    pending.cancel();

    expect((await pending).error).toBeInstanceOf(CanceledError);
  });

  it("внешний AbortSignal связывается с запросом, в т.ч. уже отменённый", async () => {
    const controller = new AbortController();
    const client = createClient(createHangingTransport());
    const pending = client.request(
      { url: "/a" },
      { signal: controller.signal },
    );

    controller.abort("outer");
    expect((await pending).error?.message).toBe("outer");

    const aborted = new AbortController();

    aborted.abort();
    const res = await client.request({ url: "/b" }, { signal: aborted.signal });

    expect(res.error).toBeInstanceOf(CanceledError);
  });

  it("middleware выполняются как луковица: первый — самый внешний", async () => {
    const order: string[] = [];
    const mw =
      (name: string): HttpMiddleware =>
      async (_ctx, next) => {
        order.push(`${name}:in`);
        const res = await next();

        order.push(`${name}:out`);

        return res;
      };
    const client = createClient(
      createFakeTransport(() => ok(1)),
      {
        middlewares: [mw("a"), mw("b")],
      },
    );

    await client.request({ url: "/a" });
    await flush();

    expect(order).toEqual(["a:in", "b:in", "b:out", "a:out"]);
  });

  it("middleware может подменить ответ и мутировать запрос", async () => {
    const transport = createFakeTransport(() => ok({ wrapped: 42 }));
    const unwrap: HttpMiddleware = async (ctx, next) => {
      ctx.request.headers = { ...ctx.request.headers, "X-Mw": "1" };
      const res = await next();

      return { ...res, data: (res.data as { wrapped: number }).wrapped };
    };
    const res = await createClient(transport, {
      middlewares: [unwrap],
    }).request({
      url: "/a",
    });

    expect(res.data).toBe(42);
    expect(transport.calls[0].headers).toMatchObject({ "X-Mw": "1" });
  });

  it("повторный next() заново прогоняет только нижележащие middleware", async () => {
    const hits: string[] = [];
    let attempt = 0;
    const transport = createFakeTransport(() => {
      attempt += 1;
      if (attempt === 1) throw new HttpError({ status: 503 });

      return ok("second");
    });
    const outer: HttpMiddleware = (_, next) => {
      hits.push("outer");

      return next();
    };
    const retry: HttpMiddleware = async (_, next) => {
      try {
        return await next();
      } catch {
        return next();
      }
    };
    const inner: HttpMiddleware = (_, next) => {
      hits.push("inner");

      return next();
    };
    const client = createClient(transport, {
      middlewares: [outer, retry, inner],
    });

    expect((await client.request({ url: "/a" })).data).toBe("second");
    expect(hits).toEqual(["outer", "inner", "inner"]);
  });
});

describe("HttpClient: отмена до транспорта", () => {
  it("отменённый в middleware запрос не доходит до транспорта", async () => {
    const transport = createFakeTransport(() => ok(1));
    const cancelInMiddleware: HttpMiddleware = (ctx, next) => {
      ctx.cancel("early");

      return next();
    };
    const res = await createClient(transport, {
      middlewares: [cancelInMiddleware],
    }).request({ url: "/a" });

    expect(res.error).toBeInstanceOf(CanceledError);
    expect(res.error?.message).toBe("early");
    expect(transport.calls).toHaveLength(0);
  });
});
