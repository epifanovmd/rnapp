import type { INotificationService } from "@shared/lib/notifications";

import { HttpError, NetworkError, TimeoutError } from "../core/errors";
import { notifyErrors } from "../middleware/notify-errors.middleware";
import {
  createFakeTransport,
  createHangingTransport,
  createTestClient,
} from "../testing/fake-transport";

const createNotifications = () =>
  ({ error: jest.fn() }) as unknown as INotificationService & {
    error: jest.Mock;
  };

const failingWith = (error: unknown) =>
  createFakeTransport(() => {
    throw error;
  });

describe("notifyErrors", () => {
  it("сеть и таймаут — один и тот же key", async () => {
    const notifications = createNotifications();

    await createTestClient(failingWith(new NetworkError()), {
      middlewares: [notifyErrors(notifications)],
    }).request({ url: "/a" });
    await createTestClient(failingWith(new TimeoutError()), {
      middlewares: [notifyErrors(notifications)],
    }).request({ url: "/a" });

    expect(notifications.error).toHaveBeenCalledTimes(2);
    expect(notifications.error).toHaveBeenLastCalledWith(
      "Нет соединения с сервером",
      { duration: 6000, key: "http:network-error" },
    );
  });

  it("5xx — сообщение сервера, fallback на дефолт", async () => {
    const notifications = createNotifications();
    const mw = notifyErrors(notifications, { serverMessage: "Упс" });

    await createTestClient(
      failingWith(new HttpError({ status: 500, body: { message: "db down" } })),
      { middlewares: [mw] },
    ).request({ url: "/a" });
    await createTestClient(
      failingWith(new HttpError({ status: 502, message: "" })),
      { middlewares: [mw] },
    ).request({ url: "/a" });

    expect(notifications.error.mock.calls).toEqual([
      ["db down", { key: "http:server-error" }],
      ["Упс", { key: "http:server-error" }],
    ]);
  });

  it("4xx, отмена и notifyErrors: false — без тоста; ошибка уходит дальше", async () => {
    const notifications = createNotifications();
    const mw = notifyErrors(notifications);

    const res = await createTestClient(
      failingWith(new HttpError({ status: 404 })),
      {
        middlewares: [mw],
      },
    ).request({ url: "/a" });
    const pending = createTestClient(createHangingTransport(), {
      middlewares: [mw],
    }).request({ url: "/a" });

    pending.cancel();
    await pending;
    await createTestClient(failingWith(new NetworkError()), {
      middlewares: [mw],
    }).request({ url: "/a" }, { notifyErrors: false });

    expect(res.error?.status).toBe(404);
    expect(notifications.error).not.toHaveBeenCalled();
  });
});
