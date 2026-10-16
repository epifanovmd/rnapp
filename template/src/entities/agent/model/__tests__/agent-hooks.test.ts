import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";
import { iocContainer } from "@shared/lib/di";
import { createFakeSocket, type IFakeSocket } from "@shared/lib/socket/testing";
import { observer } from "mobx-react-lite";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useAgentLiveMetrics } from "../useAgentLiveMetrics";
import { ALL_LOG_SOURCES, useAgentLog } from "../useAgentLog";

// Барели с нативными модулями RN: только DI-токены и чистые хуки.
jest.mock("@shared/api", () => ({
  IMainApi: jest.requireActual("@shared/api/main/main.types").IMainApi,
}));
jest.mock("@shared/lib/network", () => ({
  INetworkStatusService: () => () => undefined,
}));
jest.mock("@shared/lib/app-state", () => ({
  IAppStateService: () => () => undefined,
}));
// mobx-react-lite берёт батчинг из react-dom; в RN его нет — подмена без пакета.
jest.mock(
  "react-dom",
  () => ({ unstable_batchedUpdates: (fn: () => void) => fn() }),
  { virtual: true },
);

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const point = (at: number): IAgentMetricsPointDto =>
  ({ at }) as IAgentMetricsPointDto;

/** Рендер хука с пропом `id`; `current` — последнее значение. */
const renderWithId = async <T>(useValue: (id: string) => T, id: string) => {
  const result: { current: T } = { current: undefined as T };
  // Как экран: observer — хук читает холдер MobX во время рендера.
  const Probe = observer(({ value }: { value: string }) => {
    result.current = useValue(value);

    return null;
  });
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(createElement(Probe, { value: id }));
  });

  return {
    result,
    rerender: async (next: string) => {
      await act(async () => {
        renderer.update(createElement(Probe, { value: next }));
      });
    },
    unmount: () => act(() => renderer.unmount()),
  };
};

let socket: IFakeSocket;
const api = { getAgentMetrics: jest.fn() };

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  socket = createFakeSocket();
  api.getAgentMetrics.mockReset();
  iocContainer.unbindAll();
  iocContainer.bind("IMainApi").toConstantValue(api);
  iocContainer.bind("ISocketTransport").toConstantValue(socket);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useAgentLiveMetrics", () => {
  it("смена агента без ремаунта: точки прежнего не показываются и не попадают в окно нового", async () => {
    const now = Date.now();
    let finish!: (value: unknown) => void;

    api.getAgentMetrics
      .mockResolvedValueOnce({ data: [point(now - 2000)] })
      .mockReturnValueOnce(
        new Promise(resolve => {
          finish = resolve;
        }),
      );

    const hook = await renderWithId(useAgentLiveMetrics, "a-1");

    expect(hook.result.current.points).toHaveLength(1);

    await hook.rerender("a-2");
    expect(hook.result.current.points).toEqual([]);

    await act(async () => finish({ data: [point(now - 1000)] }));

    expect(hook.result.current.points.map(p => p.at)).toEqual([now - 1000]);
    await hook.unmount();
  });
});

describe("useAgentLog", () => {
  it("смена агента без ремаунта: записи и источник прежнего сбрасываются", async () => {
    const hook = await renderWithId(useAgentLog, "a-1");

    await act(async () =>
      socket.fire("agent:log", {
        agentId: "a-1",
        entries: [{ at: 1, level: "info", source: "kv", msg: "старый" }],
      }),
    );
    await act(async () => hook.result.current.setSource("kv"));
    expect(hook.result.current.entries).toHaveLength(1);

    await hook.rerender("a-2");

    expect(hook.result.current.entries).toEqual([]);
    expect(hook.result.current.sources).toEqual([]);
    expect(hook.result.current.source).toBe(ALL_LOG_SOURCES);
    await hook.unmount();
  });
});
