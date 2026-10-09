import {
  agentLabels,
  agentSubtitle,
  agentWorkers,
  onlineAgentFirst,
  workersSummary,
} from "../agent";
import { makeAgent, makeWorker } from "./agent-fixture";

describe("agent", () => {
  it("встроенный воркер — в конце и не входит в сводку", () => {
    const agent = makeAgent({
      workers: [
        makeWorker({ name: "sysmetrics", builtin: true, state: "backoff" }),
        makeWorker({ name: "echo" }),
        makeWorker({ name: "backup", state: "backoff" }),
      ],
    });

    expect(agentWorkers(agent).map(worker => worker.name)).toEqual([
      "echo",
      "backup",
      "sysmetrics",
    ]);
    expect(workersSummary(agent)).toEqual({ total: 2, troubled: 1 });
  });

  it("на связи — первыми, дальше по имени", () => {
    const list = [
      makeAgent({ id: "1", name: "b", online: false }),
      makeAgent({ id: "2", name: "c" }),
      makeAgent({ id: "3", name: "a", online: false }),
    ].sort(onlineAgentFirst);

    expect(list.map(agent => agent.name)).toEqual(["c", "a", "b"]);
  });

  it("подпись узла и метки", () => {
    expect(agentSubtitle(makeAgent())).toBe("агент ещё не выходил на связь");
    expect(
      agentSubtitle(
        makeAgent({
          host: { os: "linux", arch: "amd64", hostname: "node-01" },
          address: "203.0.113.10",
        }),
      ),
    ).toBe("node-01 · linux · amd64 · 203.0.113.10");
    expect(agentLabels({ zone: "eu", gpu: "" })).toEqual(["gpu", "zone=eu"]);
  });
});
