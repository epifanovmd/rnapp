import { HttpError, NetworkError, TimeoutError } from "../core/errors";
import { retry } from "../middleware/retry.middleware";
import {
  createClient,
  createFakeTransport,
  createHangingTransport,
  ok,
} from "./test-utils";

const noDelay = { delay: () => 0 };

/** Падает `failures` раз, затем отвечает. */
const flakyTransport = (failures: number, error: () => unknown) => {
  let calls = 0;

  return createFakeTransport(() => {
    calls += 1;
    if (calls <= failures) throw error();

    return ok("ok");
  });
};

describe("retry", () => {
  it("повторяет сетевую ошибку и отдаёт успешный ответ", async () => {
    const transport = flakyTransport(2, () => new NetworkError());
    const res = await createClient(transport, {
      middlewares: [retry(noDelay)],
    }).request({ url: "/a" });

    expect(res.data).toBe("ok");
    expect(transport.calls).toHaveLength(3);
  });

  it("исчерпав попытки, отдаёт последнюю ошибку", async () => {
    const transport = flakyTransport(5, () => new TimeoutError());
    const res = await createClient(transport, {
      middlewares: [retry(noDelay)],
    }).request({ url: "/a" });

    expect(res.error).toBeInstanceOf(TimeoutError);
    expect(transport.calls).toHaveLength(3);
  });

  it("по умолчанию: 5xx повторяется, 4xx нет, POST не повторяется", async () => {
    const server = flakyTransport(1, () => new HttpError({ status: 503 }));
    const client = flakyTransport(1, () => new HttpError({ status: 400 }));
    const post = flakyTransport(1, () => new NetworkError());

    expect(
      (
        await createClient(server, { middlewares: [retry(noDelay)] }).request({
          url: "/a",
        })
      ).data,
    ).toBe("ok");
    expect(
      (
        await createClient(client, { middlewares: [retry(noDelay)] }).request({
          url: "/a",
        })
      ).error?.status,
    ).toBe(400);
    expect(
      (
        await createClient(post, { middlewares: [retry(noDelay)] }).request({
          url: "/a",
          method: "POST",
        })
      ).error,
    ).toBeInstanceOf(NetworkError);
    expect(post.calls).toHaveLength(1);
  });

  it("per-call retry: false отключает, число задаёт лимит", async () => {
    const off = flakyTransport(1, () => new NetworkError());
    const limited = flakyTransport(9, () => new NetworkError());

    await createClient(off, { middlewares: [retry(noDelay)] }).request(
      { url: "/a" },
      { retry: false },
    );
    await createClient(limited, { middlewares: [retry(noDelay)] }).request(
      { url: "/a" },
      { retry: 4 },
    );

    expect(off.calls).toHaveLength(1);
    expect(limited.calls).toHaveLength(5);
  });

  it("отмена прерывает цикл и ожидание паузы", async () => {
    const transport = createHangingTransport();
    const pending = createClient(transport, {
      middlewares: [retry({ attempts: 5, delay: () => 10_000 })],
    }).request({ url: "/a" });

    pending.cancel();

    expect((await pending).error?.isCanceled).toBe(true);
    expect(transport.calls).toHaveLength(1);
  });

  it("кастомный shouldRetry и экспоненциальная пауза по умолчанию", async () => {
    const delays: number[] = [];
    const transport = flakyTransport(2, () => new HttpError({ status: 429 }));
    const res = await createClient(transport, {
      middlewares: [
        retry({
          shouldRetry: error => error.status === 429,
          delay: attempt => {
            delays.push(attempt);

            return 0;
          },
        }),
      ],
    }).request({ url: "/a", method: "POST" });

    expect(res.data).toBe("ok");
    expect(delays).toEqual([0, 1]);
  });
});
