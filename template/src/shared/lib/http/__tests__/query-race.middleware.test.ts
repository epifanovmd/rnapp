import type { HttpResponse } from "../core/types";
import {
  QUERY_RACE_CANCEL_REASON,
  queryRace,
} from "../middleware/query-race.middleware";
import {
  createFakeTransport,
  createTestClient,
  ok,
} from "../testing/fake-transport";

/** Транспорт с ручным завершением каждого запроса. */
const createManualTransport = () => {
  const resolvers: Array<(res: HttpResponse) => void> = [];
  const transport = createFakeTransport(
    (_, signal) =>
      new Promise<HttpResponse>((resolve, reject) => {
        resolvers.push(resolve);
        signal.addEventListener("abort", () =>
          reject(Object.assign(new Error(), { name: "AbortError" })),
        );
      }),
  );

  return {
    transport,
    resolve: (i: number, data: unknown) => resolvers[i](ok(data)),
  };
};

describe("queryRace", () => {
  it("новый запрос на тот же эндпоинт отменяет предыдущий", async () => {
    const { transport, resolve } = createManualTransport();
    const client = createTestClient(transport, { middlewares: [queryRace()] });
    const first = client.request({ url: "/list" });
    const second = client.request({ url: "/list" });

    resolve(1, "second");

    expect((await first).error?.message).toBe(QUERY_RACE_CANCEL_REASON);
    expect((await second).data).toBe("second");
  });

  it("разные метод/URL не мешают друг другу", async () => {
    const { transport, resolve } = createManualTransport();
    const client = createTestClient(transport, { middlewares: [queryRace()] });
    const a = client.request({ url: "/a" });
    const b = client.request({ url: "/a", method: "POST" });
    const c = client.request({ url: "/a" }, { baseUrl: "https://other" });

    resolve(0, "a");
    resolve(1, "b");
    resolve(2, "c");

    expect((await a).data).toBe("a");
    expect((await b).data).toBe("b");
    expect((await c).data).toBe("c");
  });

  it("queryRace: false выключает гонку для запроса", async () => {
    const { transport, resolve } = createManualTransport();
    const client = createTestClient(transport, { middlewares: [queryRace()] });
    const first = client.request({ url: "/list" });
    const second = client.request({ url: "/list" }, { queryRace: false });

    resolve(0, "first");
    resolve(1, "second");

    expect((await first).data).toBe("first");
    expect((await second).data).toBe("second");
  });

  it("завершённый запрос не отменяется задним числом", async () => {
    const { transport, resolve } = createManualTransport();
    const client = createTestClient(transport, { middlewares: [queryRace()] });
    const first = client.request({ url: "/list" });

    resolve(0, "first");
    await first;

    const second = client.request({ url: "/list" });

    resolve(1, "second");

    expect((await first).data).toBe("first");
    expect((await second).data).toBe("second");
  });

  it("кастомный ключ учитывает params", async () => {
    const { transport, resolve } = createManualTransport();
    const client = createTestClient(transport, {
      middlewares: [
        queryRace({
          key: ctx =>
            `${ctx.request.url}?${JSON.stringify(ctx.request.params)}`,
        }),
      ],
    });
    const a = client.request({ url: "/s", params: { q: 1 } });
    const b = client.request({ url: "/s", params: { q: 2 } });

    resolve(0, "a");
    resolve(1, "b");

    expect((await a).data).toBe("a");
    expect((await b).data).toBe("b");
  });
});
