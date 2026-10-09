import {
  countNodes,
  isNodeJobActive,
  nodeConfigView,
  nodeSubtitle,
  nodeWorkersSummary,
} from "../status";
import { makeNode, makeNodeAgent } from "./node-fixture";

describe("node status", () => {
  it("сводка настроек: в пояснении — ключи с ошибкой и в ожидании", () => {
    expect(
      nodeConfigView({ status: "synced", pending: [], failed: [] }).hint,
    ).toBeUndefined();
    expect(
      nodeConfigView({
        status: "error",
        pending: ["echo/limits"],
        failed: ["echo/prefix"],
      }).hint,
    ).toBe("Не применены: echo/prefix. Ждут применения: echo/limits");
  });

  it("задача идёт, пока в очереди или выполняется", () => {
    expect(isNodeJobActive({ status: "queued" })).toBe(true);
    expect(isNodeJobActive({ status: "running" })).toBe(true);
    expect(isNodeJobActive({ status: "failed" })).toBe(false);
  });

  it("счётчики узлов по состояниям", () => {
    expect(
      countNodes([
        { status: "online" },
        { status: "offline" },
        { status: "error" },
        { status: "created" },
      ]),
    ).toEqual({ total: 4, online: 1, offline: 1, error: 1 });
  });

  it("воркеры узла: не работает или не в порядке — проблема", () => {
    const node = makeNode({
      agent: makeNodeAgent({
        workers: [
          {
            name: "echo",
            state: "running",
            version: null,
            healthy: true,
            busy: false,
          },
          {
            name: "backup",
            state: "running",
            version: null,
            healthy: false,
            busy: false,
          },
          {
            name: "netprobe",
            state: "backoff",
            version: null,
            healthy: null,
            busy: false,
          },
        ],
      }),
    });

    expect(nodeWorkersSummary(node)).toEqual({ total: 3, troubled: 2 });
    expect(nodeWorkersSummary(makeNode())).toEqual({ total: 0, troubled: 0 });
  });

  it("подпись: адрес, версия агента, агент не выходил на связь", () => {
    expect(nodeSubtitle(makeNode({ host: null }))).toBe("адрес не задан");
    expect(nodeSubtitle(makeNode({ agent: makeNodeAgent() }))).toBe(
      "203.0.113.10 · агент 1.1.0",
    );
    expect(
      nodeSubtitle(
        makeNode({
          agent: makeNodeAgent({
            online: false,
            lastSeenAt: null,
            version: null,
          }),
        }),
      ),
    ).toBe("203.0.113.10 · агент не выходил на связь");
  });
});
