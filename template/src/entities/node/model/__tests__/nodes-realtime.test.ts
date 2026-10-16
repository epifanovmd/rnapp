import type { AccessScope } from "@shared/lib/access";
import { iocContainer } from "@shared/lib/di";
import { createFakeSocket, type IFakeSocket } from "@shared/lib/socket/testing";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useNodesRealtime } from "../useNodesRealtime";

// Барели с нативными модулями RN: только DI-токены.
jest.mock("@shared/lib/network", () => ({
  INetworkStatusService: () => () => undefined,
}));
jest.mock("@shared/lib/app-state", () => ({
  IAppStateService: () => () => undefined,
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const store = {
  load: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
  applyLoad: jest.fn(),
};
let socket: IFakeSocket;

const renderRealtime = async (scope: AccessScope | null) => {
  const Probe = ({ value }: { value: AccessScope | null }) => {
    useNodesRealtime(value);

    return null;
  };
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(createElement(Probe, { value: scope }));
  });

  return {
    rerender: async (next: AccessScope | null) => {
      await act(async () => {
        renderer.update(createElement(Probe, { value: next }));
      });
    },
    unmount: () => act(() => renderer.unmount()),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  socket = createFakeSocket();
  iocContainer.unbindAll();
  iocContainer.bind("INodesStore").toConstantValue(store);
  iocContainer.bind("ISocketTransport").toConstantValue(socket);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useNodesRealtime: пересинхронизация после переподключения", () => {
  it.each<AccessScope>(["all", "own"])(
    "область «%s» — список перечитывается один раз",
    async scope => {
      await renderRealtime(scope);

      act(() => socket.reconnect());

      expect(store.load).toHaveBeenCalledTimes(1);
    },
  );

  it("первое подключение — не переподключение, список не перечитывается", async () => {
    Object.assign(socket, { state: { status: "disconnected", error: null } });
    await renderRealtime("own");

    act(() => socket.reconnect());
    expect(store.load).not.toHaveBeenCalled();

    act(() => socket.reconnect());
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it("без права и после размонтирования — не перечитывается", async () => {
    const view = await renderRealtime(null);

    act(() => socket.reconnect());
    expect(store.load).not.toHaveBeenCalled();

    await view.rerender("own");
    view.unmount();
    act(() => socket.reconnect());
    expect(store.load).not.toHaveBeenCalled();
  });
});
