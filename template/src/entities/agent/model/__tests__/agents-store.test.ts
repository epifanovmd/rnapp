import type { IMainApi } from "@shared/api";
import type { IAgentReleaseDto } from "@shared/api/gen/main/model";

import { makeAgent, makeWorker } from "../../lib/__tests__/agent-fixture";
import { AgentsStore } from "../store";

const release: IAgentReleaseDto = {
  manifest: { version: "1.1.0", artifacts: [] },
  candidates: [
    {
      agentId: "a1",
      name: "example-node",
      online: true,
      current: "1.0.0",
      target: "1.1.0",
      os: "linux",
      arch: "amd64",
    },
  ],
  workerCandidates: [],
};

const createStore = () => {
  const getAgentRelease = jest.fn(async () => ({ data: release }));
  const api = { getAgentRelease } as unknown as IMainApi;

  return { store: new AgentsStore(api), getAgentRelease };
};

describe("AgentsStore", () => {
  it("кандидат на обновление пропадает, когда агент уже на версии выпуска", async () => {
    const { store, getAgentRelease } = createStore();

    store.upsert(makeAgent({ id: "a1", version: "1.0.0" }));
    await store.loadRelease();
    expect(store.updateCandidate("a1")?.target).toBe("1.1.0");

    store.upsert(makeAgent({ id: "a1", version: "1.1.0" }));
    expect(store.updateCandidate("a1")).toBeNull();
    // Версия сменилась — выпуск перечитывается.
    expect(getAgentRelease).toHaveBeenCalledTimes(2);
  });

  it("отложенная замена снимается итогом или когда агент перестал её показывать", () => {
    const { store } = createStore();
    const action = {
      actionId: "x1",
      agentId: "a1",
      worker: "echo",
      pending: "update",
    };

    store.trackDeferred(action);
    expect(store.deferredOf("a1", "echo")).toEqual(action);
    expect(store.settleDeferred("x1")).toEqual(action);
    expect(store.deferredOf("a1", "echo")).toBeUndefined();

    store.trackDeferred(action);
    store.upsert(
      makeAgent({ id: "a1", workers: [makeWorker({ pending: "update" })] }),
    );
    expect(store.deferredOf("a1", "echo")).toBeDefined();
    store.upsert(makeAgent({ id: "a1", workers: [makeWorker()] }));
    expect(store.deferredOf("a1", "echo")).toBeUndefined();
  });

  it("проблемы: закончившаяся убирается, удалённый агент уносит свои", () => {
    const { store } = createStore();
    const alert = {
      key: "offline",
      agentId: "a1",
      agentName: "example-node",
      type: "offline",
      message: "нет связи",
      since: 1,
    };

    store.applyAlert(alert);
    store.applyAlert({ ...alert, agentId: "a2", since: 2 });
    expect(store.alerts.map(item => item.agentId)).toEqual(["a2", "a1"]);

    store.applyAlert({ ...alert, active: false });
    expect(store.alertsOf("a1")).toEqual([]);

    store.remove("a2");
    expect(store.alerts).toEqual([]);
  });
});
