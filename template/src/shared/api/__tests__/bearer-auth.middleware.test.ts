import type { ITokenSource } from "../contract";
import { HttpError } from "../core/errors";
import { bearerAuth } from "../middleware/bearer-auth.middleware";
import { createClient, createFakeTransport, ok } from "./test-utils";

interface MockTokenSource extends ITokenSource {
  token: string;
  ensureFreshToken: jest.Mock<Promise<void>, []>;
  refreshToken: jest.Mock<Promise<void>, []>;
}

const createTokenSource = (initial = "t1"): MockTokenSource => {
  const source: MockTokenSource = {
    token: initial,
    get accessToken() {
      return source.token;
    },
    ensureFreshToken: jest.fn(async () => {}),
    refreshToken: jest.fn(async () => {
      source.token = "t2";
    }),
  };

  return source;
};

const unauthorizedOnce = () => {
  let calls = 0;

  return createFakeTransport(req => {
    calls += 1;
    if (calls === 1) throw new HttpError({ status: 401 });

    return ok({ auth: req.headers?.Authorization });
  });
};

describe("bearerAuth", () => {
  it("ставит Bearer-заголовок после ensureFreshToken", async () => {
    const source = createTokenSource();
    const transport = createFakeTransport(() => ok(null));
    const client = createClient(transport, {
      middlewares: [bearerAuth(source)],
    });

    await client.request({ url: "/a" });

    expect(source.ensureFreshToken).toHaveBeenCalledTimes(1);
    expect(transport.calls[0].headers?.Authorization).toBe("Bearer t1");
  });

  it("без токена заголовок не ставится", async () => {
    const source = createTokenSource("");
    const transport = createFakeTransport(() => ok(null));

    await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({
      url: "/a",
    });

    expect(transport.calls[0].headers?.Authorization).toBeUndefined();
  });

  it("auth: false — ни токена, ни retry", async () => {
    const source = createTokenSource();
    const transport = unauthorizedOnce();
    const res = await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({ url: "/a" }, { auth: false });

    expect(res.error?.status).toBe(401);
    expect(source.ensureFreshToken).not.toHaveBeenCalled();
    expect(source.refreshToken).not.toHaveBeenCalled();
    expect(transport.calls).toHaveLength(1);
  });

  it("401 → refresh → один повтор с новым токеном", async () => {
    const source = createTokenSource();
    const transport = unauthorizedOnce();
    const res = await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request<{ auth: string }>({ url: "/a" });

    expect(res.data).toEqual({ auth: "Bearer t2" });
    expect(source.refreshToken).toHaveBeenCalledTimes(1);
    expect(transport.calls.map(c => c.headers?.Authorization)).toEqual([
      "Bearer t1",
      "Bearer t2",
    ]);
  });

  it("повтор только один: второй 401 уходит наружу", async () => {
    const source = createTokenSource();
    const transport = createFakeTransport(() => {
      throw new HttpError({ status: 401 });
    });
    const res = await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({ url: "/a" });

    expect(res.error?.status).toBe(401);
    expect(transport.calls).toHaveLength(2);
    expect(source.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("refresh упал — исходный 401 без повтора", async () => {
    const source = createTokenSource();

    source.refreshToken.mockRejectedValue(new Error("expired"));
    const transport = unauthorizedOnce();
    const res = await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({ url: "/a" });

    expect(res.error?.status).toBe(401);
    expect(transport.calls).toHaveLength(1);
  });

  it("параллельные 401 делят один refresh", async () => {
    const source = createTokenSource();
    let resolveRefresh!: () => void;

    source.refreshToken.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRefresh = () => {
            source.token = "t2";
            resolve();
          };
        }),
    );
    const transport = createFakeTransport(req =>
      req.headers?.Authorization === "Bearer t2"
        ? ok("ok")
        : Promise.reject(new HttpError({ status: 401 })),
    );
    const client = createClient(transport, {
      middlewares: [bearerAuth(source)],
    });
    const a = client.request({ url: "/a" });
    const b = client.request({ url: "/b" });

    await new Promise(r => setTimeout(r, 0));
    resolveRefresh();

    expect((await a).data).toBe("ok");
    expect((await b).data).toBe("ok");
    expect(source.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("не-401 ошибки и retryOnUnauthorized: false — без refresh", async () => {
    const source = createTokenSource();
    const server = createFakeTransport(() => {
      throw new HttpError({ status: 500 });
    });

    await createClient(server, { middlewares: [bearerAuth(source)] }).request({
      url: "/a",
    });
    await createClient(unauthorizedOnce(), {
      middlewares: [bearerAuth(source, { retryOnUnauthorized: false })],
    }).request({ url: "/a" });

    expect(source.refreshToken).not.toHaveBeenCalled();
  });

  it("ошибка ensureFreshToken не блокирует запрос", async () => {
    const source = createTokenSource();

    source.ensureFreshToken.mockRejectedValue(new Error("offline"));
    const transport = createFakeTransport(() => ok(1));
    const res = await createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({ url: "/a" });

    expect(res.data).toBe(1);
  });

  it("кастомные header/scheme", async () => {
    const source = createTokenSource("k");
    const transport = createFakeTransport(() => ok(null));

    await createClient(transport, {
      middlewares: [bearerAuth(source, { header: "X-Token", scheme: "Token" })],
    }).request({ url: "/a" });

    expect(transport.calls[0].headers).toMatchObject({ "X-Token": "Token k" });
  });

  it("после отмены запроса 401 не ведёт к refresh", async () => {
    const source = createTokenSource();
    const transport = createFakeTransport(
      (_, signal) =>
        new Promise((_r, reject) =>
          signal.addEventListener("abort", () =>
            reject(new HttpError({ status: 401 })),
          ),
        ),
    );
    const pending = createClient(transport, {
      middlewares: [bearerAuth(source)],
    }).request({ url: "/a" });

    pending.cancel();

    expect((await pending).error?.isCanceled).toBe(true);
    expect(source.refreshToken).not.toHaveBeenCalled();
  });
});
