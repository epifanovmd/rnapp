import { createFakeSocket } from "@shared/lib/socket/testing";

import { FileRealtime } from "../realtime";

// Декоратор DI из бареля — без нативных модулей RN.
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const setup = (isIdle: boolean, status: "connected" | "connecting") => {
  const socket = createFakeSocket();

  Object.assign(socket, { state: { status, error: null } });

  const store = {
    filesHolder: { isIdle },
    refresh: jest.fn(async () => undefined),
  };
  const dispose = new FileRealtime(socket, store as never).initialize();

  return { socket, store, dispose };
};

describe("FileRealtime — переподключение", () => {
  it("после обрыва (в том числе фона) список перечитывается", () => {
    const { socket, store } = setup(false, "connected");

    socket.reconnect();

    expect(store.refresh).toHaveBeenCalledTimes(1);
  });

  it("список не загружали или первое подключение — без запроса", () => {
    const idle = setup(true, "connected");
    const first = setup(false, "connecting");

    idle.socket.reconnect();
    first.socket.reconnect();

    expect(idle.store.refresh).not.toHaveBeenCalled();
    expect(first.store.refresh).not.toHaveBeenCalled();
  });

  it("после dispose переподключение не трогает стор", () => {
    const { socket, store, dispose } = setup(false, "connected");

    dispose();
    socket.reconnect();

    expect(store.refresh).not.toHaveBeenCalled();
  });
});
