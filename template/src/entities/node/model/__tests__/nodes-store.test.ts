import type { IMainApi } from "@shared/api";

import { makeNode } from "../../lib/__tests__/node-fixture";
import { NodesStore } from "../store";

describe("NodesStore", () => {
  it("узлы по названию; узел с сервера попадает в список", async () => {
    const getNodeById = jest.fn(async () => ({
      data: makeNode({ id: "n3", name: "a" }),
    }));
    const store = new NodesStore({ getNodeById } as unknown as IMainApi);

    store.upsert(makeNode({ id: "n1", name: "c" }));
    store.upsert(makeNode({ id: "n2", name: "b" }));
    await store.fetch("n3");

    expect(store.nodes.map(node => node.name)).toEqual(["a", "b", "c"]);
    store.remove("n2");
    expect(store.byId("n2")).toBeUndefined();
  });

  it("нагрузка: более старая точка не заменяет свежую", () => {
    const store = new NodesStore({} as IMainApi);

    store.applyLoad({ nodeId: "n1", agentId: "a1", point: { at: 10 } });
    store.applyLoad({ nodeId: "n1", agentId: "a1", point: { at: 5 } });
    expect(store.loadOf("n1")?.point.at).toBe(10);

    store.remove("n1");
    expect(store.loadOf("n1")).toBeUndefined();
  });
});
