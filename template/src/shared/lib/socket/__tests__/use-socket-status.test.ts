import { iocContainer } from "@shared/lib/di";
import { createElement, useLayoutEffect } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import { useSocketStatus } from "../hooks";
import { createFakeSocket } from "../testing";
import {
  ISocketTransport,
  type SocketStatusListener,
  type SocketTransportState,
} from "../transport";

jest.mock("@react-native-community/netinfo", () => ({}));
jest.mock("socket.io-client", () => ({ connect: jest.fn() }));

/** Фейковый сокет со статусом, который тест меняет вручную. */
const bindSocketWithStatus = (initial: SocketTransportState["status"]) => {
  const socket = createFakeSocket();
  const listeners = new Set<SocketStatusListener>();
  let state: SocketTransportState = { status: initial, error: null };

  Object.defineProperty(socket, "state", { get: () => state });
  socket.onStatusChange = listener => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  if (iocContainer.isBound(ISocketTransport.Tid)) {
    iocContainer.unbind(ISocketTransport.Tid);
  }
  iocContainer.bind(ISocketTransport.Tid).toConstantValue(socket);

  return {
    listeners,
    setStatus: (status: SocketTransportState["status"]) => {
      state = { status, error: null };
      listeners.forEach(listener => listener(state));
    },
  };
};

/** Пишет статус каждого рендера; `onLayout` — после рендера, но до подписки хука. */
const Status = ({
  seen,
  onLayout,
}: {
  seen: string[];
  onLayout?: () => void;
}) => {
  seen.push(useSocketStatus().status);
  useLayoutEffect(() => onLayout?.(), [onLayout]);

  return null;
};

describe("useSocketStatus", () => {
  beforeEach(() => {
    // react-test-renderer пишет в console.error о своей устарелости.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("следует за сменой статуса и отписывается при размонтировании", async () => {
    const { listeners, setStatus } = bindSocketWithStatus("connecting");
    const seen: string[] = [];
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(createElement(Status, { seen }));
    });
    expect(seen.at(-1)).toBe("connecting");

    await act(async () => setStatus("connected"));
    expect(seen.at(-1)).toBe("connected");

    await act(async () => renderer?.unmount());
    expect(listeners.size).toBe(0);
  });

  it("не теряет смену статуса между рендером и подпиской", async () => {
    const { setStatus } = bindSocketWithStatus("connecting");
    const seen: string[] = [];
    const onLayout = () => setStatus("connected");

    await act(async () => {
      create(createElement(Status, { seen, onLayout }));
    });

    expect(seen.at(-1)).toBe("connected");
  });
});
