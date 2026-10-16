import type { NodeDto } from "@shared/api/gen/main/model";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useProvisionNodeAgentVM } from "../useProvisionNodeAgentVM";

const mockApi = {
  createNodeInstallCommand: jest.fn(),
  installNodeAgent: jest.fn(async () => ({ data: { jobId: "j1" } })),
  uninstallNodeAgent: jest.fn(),
};

jest.mock("@entities/agent", () => ({
  IAgentsStore: {
    useInstance: () => ({ release: null, loadRelease: () => undefined }),
  },
  releaseWorkerNames: () => [],
}));
jest.mock("@shared/api", () => ({
  IMainApi: { useInstance: () => mockApi },
}));
jest.mock("@shared/lib/notifications", () => ({
  INotificationService: {
    useInstance: () => ({ error: jest.fn(), success: jest.fn() }),
  },
}));
jest.mock("@shared/ui", () => ({
  useZodForm: jest.requireActual("@shared/ui/form/model/use-zod-form")
    .useZodForm,
}));

const NODE = { id: "n1", name: "node-01", host: null } as unknown as NodeDto;

const COMMAND = {
  command: "curl … | sh",
  expiresAt: "2026-10-16T00:00:00.000Z",
};

const COMMAND_VALUES = {
  expiresInMinutes: 60,
  baseUrl: "",
  workers: [],
};

const SSH_VALUES = {
  host: "",
  port: 22,
  username: "root",
  auth: "password" as const,
  password: "secret",
  privateKey: "",
  passphrase: "",
  sudo: true,
  backendUrl: "",
  workers: [],
  purge: false,
};

let vm!: ReturnType<typeof useProvisionNodeAgentVM>;

const Probe = () => {
  vm = useProvisionNodeAgentVM();

  return null;
};

const render = async () => {
  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });
  await act(async () => vm.openFor(NODE, "install", "command"));
};

beforeEach(() => {
  jest.clearAllMocks();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useProvisionNodeAgentVM", () => {
  it("шторку смахнули, пока выпускалась команда, — она открывается снова с командой", async () => {
    let resolve!: (value: { data: typeof COMMAND }) => void;

    mockApi.createNodeInstallCommand.mockReturnValue(
      new Promise(done => (resolve = done)),
    );
    await render();

    let pending!: Promise<void>;

    await act(async () => {
      pending = vm.createCommand(COMMAND_VALUES);
    });
    await act(async () => {
      vm.close();
      vm.onClosed();
    });
    await act(async () => {
      resolve({ data: COMMAND });
      await pending;
    });

    expect(vm.open).toBe(true);
    expect(vm.node?.id).toBe("n1");
    expect(vm.command).toEqual(COMMAND);
  });

  it("пока выпускается команда, установка по SSH не запускается", async () => {
    let resolve!: (value: { data: typeof COMMAND }) => void;

    mockApi.createNodeInstallCommand.mockReturnValue(
      new Promise(done => (resolve = done)),
    );
    await render();

    await act(async () => {
      const command = vm.createCommand(COMMAND_VALUES);
      const ssh = vm.submitSsh(SSH_VALUES);

      resolve({ data: COMMAND });
      await Promise.all([command, ssh]);
    });

    expect(mockApi.installNodeAgent).not.toHaveBeenCalled();
  });
});
