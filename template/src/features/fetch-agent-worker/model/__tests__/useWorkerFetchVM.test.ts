import type { AgentDto } from "@shared/api/gen/main/model";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useWorkerFetchVM } from "../useWorkerFetchVM";

const mockApi = { fetchAgentWorker: jest.fn() };

jest.mock("@entities/agent", () => ({
  configuredWorkers: (agent: { workers: unknown[] }) => agent.workers,
  formatJson: (value: unknown) => JSON.stringify(value),
  schemaSkeleton: () => ({}),
}));
jest.mock("@shared/api", () => ({
  IMainApi: { useInstance: () => mockApi },
}));
jest.mock("@shared/lib/http", () => ({ isHttpError: () => false }));

const AGENT = {
  id: "a1",
  workers: [{ name: "echo", manifest: { routes: [] } }],
} as unknown as AgentDto;

let vm!: ReturnType<typeof useWorkerFetchVM>;

const Probe = () => {
  vm = useWorkerFetchVM(AGENT);

  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useWorkerFetchVM", () => {
  it("повторное нажатие до ответа не шлёт второй запрос воркеру", async () => {
    let resolve!: (value: { data: string }) => void;

    mockApi.fetchAgentWorker.mockReturnValue(
      new Promise(done => (resolve = done)),
    );
    await act(async () => {
      TestRenderer.create(createElement(Probe));
    });

    await act(async () => {
      const first = vm.send();
      const second = vm.send();

      resolve({ data: "ok" });
      await Promise.all([first, second]);
    });

    expect(mockApi.fetchAgentWorker).toHaveBeenCalledTimes(1);
    expect(vm.result?.ok).toBe(true);
  });
});
