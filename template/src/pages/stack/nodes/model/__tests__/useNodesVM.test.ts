import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useNodesVM } from "../useNodesVM";

const mockSocket = { connected: true };
const mockMeshRefresh = jest.fn(async () => undefined);

jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/lib/permissions"),
  IAgentsStore: {
    useInstance: () => ({
      load: () => undefined,
      loadRelease: () => undefined,
      byId: () => undefined,
    }),
  },
  useAgentsRealtime: () => undefined,
}));
jest.mock("@entities/node", () => ({
  ...jest.requireActual("@entities/node/lib/permissions"),
  INodesStore: {
    useInstance: () => ({
      nodes: [],
      isLoaded: true,
      isLoading: false,
      error: null,
      load: () => undefined,
      loadOf: () => undefined,
      upsert: () => undefined,
      remove: () => undefined,
    }),
  },
  countNodes: () => ({ total: 0, online: 0, offline: 0, error: 0 }),
  filterNodes: () => [],
  nodeOwners: () => [],
  useNodesRealtime: () => undefined,
}));
jest.mock("@entities/user", () => ({
  IUserStore: {
    useInstance: () => ({
      scope: () => "own",
      can: () => true,
      canOn: () => true,
      user: null,
    }),
  },
}));
jest.mock("@features/assign-node-owner", () => ({
  useAssignNodeOwnerVM: () => ({ open: false, close: () => undefined }),
}));
jest.mock("@features/manage-node", () => ({
  useDeleteNode: () => async () => false,
  useNodeFormVM: () => ({ open: false, setOpen: () => undefined }),
}));
jest.mock("@features/provision-node-agent", () => ({
  useProvisionNodeAgentVM: () => ({ open: false, close: () => undefined }),
}));
jest.mock("@shared/api", () => ({
  IMainApi: { useInstance: () => ({ getNodeMesh: async () => ({}) }) },
}));
jest.mock("@shared/lib/holders", () => {
  const holder = { refresh: () => mockMeshRefresh() };

  return {
    useEntity: () => ({
      data: null,
      holder,
      setData: () => undefined,
      refresh: () => mockMeshRefresh(),
    }),
  };
});
jest.mock("@shared/lib/hooks", () => ({
  useCloseWhenForbidden: () => undefined,
}));
jest.mock("@shared/lib/socket", () => ({
  useSocketEvent: () => undefined,
  useIsSocketConnected: () => mockSocket.connected,
}));

const Probe = () => {
  useNodesVM();

  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSocket.connected = true;
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useNodesVM", () => {
  it("после переподключения связность перечитывается (события за обрыв потеряны)", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    expect(mockMeshRefresh).not.toHaveBeenCalled();

    mockSocket.connected = false;
    await act(async () => renderer.update(createElement(Probe)));
    expect(mockMeshRefresh).not.toHaveBeenCalled();

    mockSocket.connected = true;
    await act(async () => renderer.update(createElement(Probe)));
    expect(mockMeshRefresh).toHaveBeenCalledTimes(1);
  });

  it("первое подключение после открытия экрана — без лишнего перечитывания", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    mockSocket.connected = false;
    await act(async () => {
      renderer = TestRenderer.create(createElement(Probe));
    });
    mockSocket.connected = true;
    await act(async () => renderer.update(createElement(Probe)));

    expect(mockMeshRefresh).not.toHaveBeenCalled();
  });
});
