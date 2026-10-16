import { createFakeSocket } from "@shared/lib/socket/testing";

import { JobRealtime } from "../realtime";

// Декоратор DI из бареля — без нативных модулей RN.
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const setup = (isIdle: boolean, status: "connected" | "connecting") => {
  const socket = createFakeSocket();

  Object.assign(socket, { state: { status, error: null } });

  const store = {
    jobsHolder: { isIdle },
    refresh: jest.fn(async () => undefined),
    handleJobUpdated: jest.fn(),
  };
  const dispose = new JobRealtime(socket, store as never).initialize();

  return { socket, store, dispose };
};

describe("JobRealtime — переподключение", () => {
  it("после обрыва (в том числе фона) список перечитывается: события за обрыв не теряются", () => {
    const { socket, store } = setup(false, "connected");

    socket.reconnect();

    expect(store.refresh).toHaveBeenCalledTimes(1);
  });

  it("список ещё не загружали — переподключение его не грузит", () => {
    const { socket, store } = setup(true, "connected");

    socket.reconnect();

    expect(store.refresh).not.toHaveBeenCalled();
  });

  it("первое подключение после initialize — не переподключение", () => {
    const { socket, store } = setup(false, "connecting");

    socket.reconnect();
    expect(store.refresh).not.toHaveBeenCalled();

    socket.reconnect();
    expect(store.refresh).toHaveBeenCalledTimes(1);
  });

  it("после dispose ни события, ни переподключение не трогают стор", () => {
    const { socket, store, dispose } = setup(false, "connected");

    dispose();
    socket.reconnect();
    socket.fire("job:updated", { id: "j1" });

    expect(store.refresh).not.toHaveBeenCalled();
    expect(store.handleJobUpdated).not.toHaveBeenCalled();
  });
});
