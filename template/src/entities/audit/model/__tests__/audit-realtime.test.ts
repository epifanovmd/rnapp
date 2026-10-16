import { createFakeSocket } from "@shared/lib/socket/testing";

import { AuditRealtime } from "../realtime";

// Декоратор DI из бареля — без нативных модулей RN.
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const setup = (isSuccess: boolean, status: "connected" | "connecting") => {
  const socket = createFakeSocket();

  Object.assign(socket, { state: { status, error: null } });

  const store = {
    eventsHolder: { isSuccess },
    load: jest.fn(async () => undefined),
    prepend: jest.fn(),
  };
  const dispose = new AuditRealtime(socket, store as never).initialize();

  return { socket, store, dispose };
};

describe("AuditRealtime — переподключение", () => {
  it("после обрыва (в том числе фона) лента перечитывается: события за обрыв не теряются", () => {
    const { socket, store } = setup(true, "connected");

    socket.reconnect();

    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it("лента не загружена или первое подключение — без запроса", () => {
    const idle = setup(false, "connected");
    const first = setup(true, "connecting");

    idle.socket.reconnect();
    first.socket.reconnect();

    expect(idle.store.load).not.toHaveBeenCalled();
    expect(first.store.load).not.toHaveBeenCalled();
  });

  it("после dispose ни события, ни переподключение не трогают стор", () => {
    const { socket, store, dispose } = setup(true, "connected");

    dispose();
    socket.reconnect();
    socket.fire("audit:created", { id: "e1" });

    expect(store.load).not.toHaveBeenCalled();
    expect(store.prepend).not.toHaveBeenCalled();
  });
});
