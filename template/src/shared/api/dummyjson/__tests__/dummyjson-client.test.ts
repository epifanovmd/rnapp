import { AxiosTransport, HttpError } from "@shared/lib/http";
import {
  createFakeTransport,
  ok,
} from "@shared/lib/http/testing/fake-transport";
import type { INotificationService } from "@shared/lib/notifications/notification.types";

import { DummyJsonApi } from "../dummyjson.api";
import {
  createDummyJsonHttpClient,
  DUMMYJSON_BASE_URL,
} from "../dummyjson-http-client";

const notifications = { error: jest.fn() } as unknown as INotificationService;

const deps = (session: ReturnType<typeof createSession>) => ({
  session,
  notifications,
});

const createSession = () => {
  let token = "access-1";

  return {
    get accessToken() {
      return token;
    },
    get isAuthorized() {
      return !!token;
    },
    ensureFreshToken: () => Promise.resolve(),
    refreshToken: jest.fn(async () => {
      token = "access-2";
    }),
  };
};

describe("клиент DummyJSON", () => {
  it("подставляет baseUrl и токен сессии", async () => {
    const transport = createFakeTransport(() => ok([]));
    const session = createSession();
    const api = new DummyJsonApi(
      createDummyJsonHttpClient(deps(session), transport),
    );

    await api.getCategories();

    expect(transport.calls[0]).toMatchObject({
      baseUrl: DUMMYJSON_BASE_URL,
      headers: { Authorization: "Bearer access-1" },
    });
    expect(DUMMYJSON_BASE_URL).toBe("https://dummyjson.com");
  });

  it("401 обновляет токен сессии и повторяет запрос", async () => {
    let calls = 0;
    const transport = createFakeTransport(req => {
      calls += 1;
      if (calls === 1) throw new HttpError({ status: 401 });

      return ok({ id: 1, headers: req.headers });
    });
    const session = createSession();
    const api = new DummyJsonApi(
      createDummyJsonHttpClient(deps(session), transport),
    );
    const res = await api.getMe();

    expect(res.error).toBeUndefined();
    expect(session.refreshToken).toHaveBeenCalledTimes(1);
    expect(transport.calls[1].headers?.Authorization).toBe("Bearer access-2");
  });

  it("по умолчанию транспорт — axios", () => {
    const client = createDummyJsonHttpClient(deps(createSession()));

    expect(client).toBeDefined();
    expect(new AxiosTransport()).toBeInstanceOf(AxiosTransport);
  });
});
