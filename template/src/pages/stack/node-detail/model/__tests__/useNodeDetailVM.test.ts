import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useNodeDetailVM } from "../useNodeDetailVM";

type THandler = (...args: unknown[]) => void;

const mockSocketHandlers = new Map<string, THandler>();
const mockRooms = new Map<string, () => void>();
const mockToast = { warning: jest.fn(), success: jest.fn() };
const mockNavigation = { canGoBack: () => true, goBack: jest.fn() };
const mockRefresh = jest.fn(async (_id?: string) => undefined);
const mockDelete: {
  options: { onDeleted?: (node: { id: string }) => void };
  run: jest.Mock;
} = { options: {}, run: jest.fn() };
const mockNode = {
  id: "n-1",
  name: "alpha",
  agentId: null,
  agent: null,
  job: { id: "j-1" },
};
const mockNodesStore = {
  fetch: async () => ({ data: mockNode }),
  byId: () => mockNode,
  upsert: jest.fn(),
  remove: jest.fn(),
};

jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/lib/permissions"),
  IAgentsStore: {
    useInstance: () => ({
      fetch: async () => ({ data: null }),
      loadAlerts: () => undefined,
      loadRelease: () => undefined,
      byId: () => undefined,
      upsert: () => undefined,
      applyAlert: () => undefined,
      alertsOf: () => [],
      updateCandidate: () => undefined,
    }),
  },
  isAgentLive: () => false,
  useAgentsRealtime: () => undefined,
}));
jest.mock("@entities/node", () => ({
  ...jest.requireActual("@entities/node/lib/permissions"),
  INodesStore: { useInstance: () => mockNodesStore },
  nodeAddressMismatch: () => false,
  nodeOwners: () => [],
}));
jest.mock("@entities/user", () => ({
  IUserStore: {
    useInstance: () => ({
      scope: () => "all",
      can: () => true,
      canOn: () => true,
    }),
  },
}));
jest.mock("@features/assign-node-owner", () => ({
  useAssignNodeOwnerVM: () => ({ open: false, close: () => undefined }),
}));
jest.mock("@features/manage-agent", () => ({
  useAgentActions: () => ({}),
}));
jest.mock("@features/manage-node", () => ({
  useDeleteNode: (options: typeof mockDelete.options) => {
    mockDelete.options = options;

    return mockDelete.run;
  },
  useNodeFormVM: () => ({ open: false, setOpen: () => undefined }),
}));
jest.mock("@features/provision-node-agent", () => ({
  useProvisionNodeAgentVM: () => ({ open: false, close: () => undefined }),
}));
jest.mock("@shared/api", () => ({
  IMainApi: { useInstance: () => ({ getJob: async () => ({ data: null }) }) },
}));
jest.mock("@shared/lib/holders", () => ({
  useEntity: () => ({
    refresh: mockRefresh,
    isError: false,
    data: null,
    setData: () => undefined,
  }),
}));
jest.mock("@shared/lib/hooks", () => ({
  useCloseWhenForbidden: () => undefined,
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
  useSocketRoom: (type: string, id: string | null, onRejoin?: () => void) => {
    if (id && onRejoin) mockRooms.set(type, onRejoin);
  },
}));

type TVM = ReturnType<typeof useNodeDetailVM>;

const renderVM = async () => {
  const ref: { current: TVM | null } = { current: null };
  const Probe = () => {
    ref.current = useNodeDetailVM("n-1");

    return null;
  };

  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });

  return ref as { current: TVM };
};

/** Удаление, ответ HTTP на которое придёт по `respond(ok)`. */
const deferDelete = () => {
  let respond: (ok: boolean) => void = () => undefined;

  mockDelete.run.mockImplementation(
    (node: { id: string }) =>
      new Promise<boolean>(resolve => {
        respond = ok => {
          if (ok) mockDelete.options.onDeleted?.(node);
          resolve(ok);
        };
      }),
  );

  return (ok: boolean) => respond(ok);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSocketHandlers.clear();
  mockRooms.clear();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useNodeDetailVM", () => {
  it("своё удаление: событие «удалён» раньше ответа — без предупреждения, уход один раз", async () => {
    const respond = deferDelete();
    const vm = await renderVM();
    let removing: Promise<boolean> = Promise.resolve(false);

    act(() => {
      removing = vm.current.removeNode(mockNode as never);
    });
    act(() => mockSocketHandlers.get("node:deleted")?.({ id: "n-1" }));
    await act(async () => {
      respond(true);
      await removing;
    });

    expect(mockToast.warning).not.toHaveBeenCalled();
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    await expect(removing).resolves.toBe(true);
  });

  it("удаление не прошло, а событие «удалён» пришло — предупреждение и уход", async () => {
    const respond = deferDelete();
    const vm = await renderVM();
    let removing: Promise<boolean> = Promise.resolve(false);

    act(() => {
      removing = vm.current.removeNode(mockNode as never);
    });
    act(() => mockSocketHandlers.get("node:deleted")?.({ id: "n-1" }));
    await act(async () => {
      respond(false);
      await removing;
    });

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("узел удалили другие — предупреждение и уход", async () => {
    await renderVM();

    act(() => mockSocketHandlers.get("node:deleted")?.({ id: "n-1" }));

    expect(mockNodesStore.remove).toHaveBeenCalledWith("n-1");
    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("после переподключения перечитывается и задача установки", async () => {
    await renderVM();

    act(() => mockRooms.get("node")?.());

    expect(mockRefresh).toHaveBeenCalledWith("n-1");
    expect(mockRefresh).toHaveBeenCalledWith("j-1");
  });
});
