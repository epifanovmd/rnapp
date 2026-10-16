import { createFakeSocket } from "@shared/lib/socket/testing";

import { UserSocketService } from "../../api/user-socket";
import { UserRealtime } from "../realtime";

// Декоратор DI из бареля — без нативных модулей RN.
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const setup = () => {
  let handlers: Record<string, (data: unknown) => void> = {};
  const socket = {
    subscribe: (h: typeof handlers) => {
      handlers = h;

      return () => {};
    },
  };
  const userStore = {
    user: { id: "u1" },
    refresh: jest.fn().mockResolvedValue({ data: null, error: null }),
    patchProfile: jest.fn(),
  };

  new UserRealtime(
    socket as never,
    userStore as never,
    {} as never,
  ).initialize();

  return { handlers, userStore };
};

describe("UserRealtime", () => {
  it("свой profile:updated (публичный профиль, без avatar) — перечитать пользователя, аватар с другого устройства", () => {
    const { handlers, userStore } = setup();

    handlers.onProfileUpdated({ userId: "u1", avatarUrl: "https://x/a.webp" });

    expect(userStore.refresh).toHaveBeenCalledTimes(1);
    expect(userStore.patchProfile).not.toHaveBeenCalled();
  });

  it("чужой profile:updated игнорируется", () => {
    const { handlers, userStore } = setup();

    handlers.onProfileUpdated({ userId: "u2", avatarUrl: null });

    expect(userStore.refresh).not.toHaveBeenCalled();
  });
});

describe("UserRealtime — переподключение", () => {
  const create = (status: "connected" | "connecting") => {
    const socket = createFakeSocket();

    Object.assign(socket, { state: { status, error: null } });

    const userStore = {
      user: { id: "u1" },
      refresh: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const dispose = new UserRealtime(
      new UserSocketService(socket),
      userStore as never,
      {} as never,
    ).initialize();

    return { socket, userStore, dispose };
  };

  it("после обрыва (в том числе фона) пользователь перечитывается: права и профиль за обрыв не теряются", () => {
    const { socket, userStore } = create("connected");

    socket.reconnect();

    expect(userStore.refresh).toHaveBeenCalledTimes(1);
  });

  it("первое подключение — без лишнего запроса", () => {
    const { socket, userStore } = create("connecting");

    socket.reconnect();
    expect(userStore.refresh).not.toHaveBeenCalled();

    socket.reconnect();
    expect(userStore.refresh).toHaveBeenCalledTimes(1);
  });

  it("после dispose переподключение не трогает стор", () => {
    const { socket, userStore, dispose } = create("connected");

    dispose();
    socket.reconnect();

    expect(userStore.refresh).not.toHaveBeenCalled();
  });
});
