import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useAgentDetailVM } from "../useAgentDetailVM";

type THandler = (...args: unknown[]) => void;

const mockSocketHandlers = new Map<string, THandler>();
const mockToast = { warning: jest.fn(), success: jest.fn() };
const mockNavigation = { canGoBack: () => true, goBack: jest.fn() };
const mockActions: {
  options: { onDeleted?: (agent: { id: string }) => void };
  remove: jest.Mock;
} = { options: {}, remove: jest.fn() };
const mockAgent = { id: "a-1", name: "alpha", revoked: true };

jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/lib/permissions"),
  IAgentsStore: {
    useInstance: () => ({
      fetch: async () => ({ data: mockAgent }),
      loadAlerts: () => undefined,
      loadRelease: () => undefined,
      byId: () => mockAgent,
      updateCandidate: () => undefined,
      alertsOf: () => [],
    }),
  },
  isAgentLive: () => false,
  useAgentsRealtime: () => undefined,
}));
jest.mock("@entities/node", () => ({
  ...jest.requireActual("@entities/node/lib/permissions"),
  INodesStore: {
    useInstance: () => ({ isLoaded: true, load: () => undefined, nodes: [] }),
  },
}));
jest.mock("@entities/user", () => ({
  IUserStore: { useInstance: () => ({ can: () => true }) },
}));
jest.mock("@features/manage-agent", () => ({
  useAgentActions: (options: typeof mockActions.options) => {
    mockActions.options = options;

    return {
      remove: mockActions.remove,
      revoke: jest.fn(),
      rotateKey: jest.fn(),
      update: jest.fn(),
      isBusy: () => false,
    };
  },
}));
jest.mock("@shared/lib/access", () => ({
  ownPermission: (permission: string) => permission,
}));
jest.mock("@shared/lib/holders", () => ({
  useEntity: () => ({ refresh: async () => undefined, isError: false }),
}));
jest.mock("@shared/lib/navigation", () => ({
  useNavigation: () => mockNavigation,
}));
jest.mock("@shared/lib/notifications", () => ({
  INotificationService: { useInstance: () => mockToast },
}));
jest.mock("@shared/lib/socket", () => ({
  useSocketEvent: (event: string, handler: THandler, enabled = true) => {
    if (enabled) mockSocketHandlers.set(event, handler);
  },
  useSocketRoom: () => undefined,
}));

type TVM = ReturnType<typeof useAgentDetailVM>;

const renderVM = async () => {
  const ref: { current: TVM | null } = { current: null };
  const Probe = () => {
    ref.current = useAgentDetailVM("a-1");

    return null;
  };

  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });

  return ref as { current: TVM };
};

/** Удаление, ответ HTTP на которое придёт по `respond(ok)`. */
const deferRemove = () => {
  let respond: (ok: boolean) => void = () => undefined;

  mockActions.remove.mockImplementation(
    (agent: { id: string }) =>
      new Promise<void>(resolve => {
        respond = ok => {
          if (ok) mockActions.options.onDeleted?.(agent);
          resolve();
        };
      }),
  );

  return (ok: boolean) => respond(ok);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSocketHandlers.clear();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useAgentDetailVM", () => {
  it("своё удаление: событие «удалён» раньше ответа — без предупреждения, уход один раз", async () => {
    const respond = deferRemove();
    const vm = await renderVM();
    let removing: Promise<void> = Promise.resolve();

    act(() => {
      removing = vm.current.actions.remove(mockAgent as never);
    });
    act(() => mockSocketHandlers.get("agent:deleted")?.({ id: "a-1" }));
    await act(async () => {
      respond(true);
      await removing;
    });

    expect(mockToast.warning).not.toHaveBeenCalled();
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("удаление не прошло, а событие «удалён» пришло — предупреждение и уход", async () => {
    const respond = deferRemove();
    const vm = await renderVM();
    let removing: Promise<void> = Promise.resolve();

    act(() => {
      removing = vm.current.actions.remove(mockAgent as never);
    });
    act(() => mockSocketHandlers.get("agent:deleted")?.({ id: "a-1" }));
    await act(async () => {
      respond(false);
      await removing;
    });

    expect(mockToast.warning).toHaveBeenCalledWith("Агент удалён");
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("агента удалили другие — предупреждение и уход", async () => {
    await renderVM();

    act(() => mockSocketHandlers.get("agent:deleted")?.({ id: "a-1" }));

    expect(mockToast.warning).toHaveBeenCalledWith("Агент удалён");
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
