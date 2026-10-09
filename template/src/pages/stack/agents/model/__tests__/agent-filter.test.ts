import type { AgentDto } from "@shared/api/gen/main/model";

import { filterAgents } from "../agent-filter";

const agent = (patch: Partial<AgentDto>): AgentDto => ({
  id: "a",
  name: "node-01",
  labels: {},
  online: true,
  revoked: false,
  enrolledAt: 1,
  workers: [],
  alerts: [],
  ...patch,
});

const agents = [
  agent({ id: "a1", name: "alpha", labels: { zone: "eu" } }),
  agent({ id: "a2", name: "beta", online: false }),
  agent({ id: "a3", name: "gamma", revoked: true, address: "203.0.113.7" }),
];

const context = {
  hasAlerts: (id: string) => id === "a2",
  hasUpdate: (id: string) => id === "a1",
};

const ids = (list: AgentDto[]) => list.map(item => item.id);

describe("filterAgents", () => {
  it("по состоянию: отозванный — не на связи", () => {
    expect(ids(filterAgents(agents, "online", "", context))).toEqual(["a1"]);
    expect(ids(filterAgents(agents, "offline", "", context))).toEqual([
      "a2",
      "a3",
    ]);
    expect(ids(filterAgents(agents, "problems", "", context))).toEqual(["a2"]);
    expect(ids(filterAgents(agents, "updates", "", context))).toEqual(["a1"]);
  });

  it("поиск по имени, адресу и меткам", () => {
    expect(ids(filterAgents(agents, "all", "ZONE=eu", context))).toEqual([
      "a1",
    ]);
    expect(ids(filterAgents(agents, "all", "203.0", context))).toEqual(["a3"]);
    expect(ids(filterAgents(agents, "all", " ", context))).toHaveLength(3);
  });
});
