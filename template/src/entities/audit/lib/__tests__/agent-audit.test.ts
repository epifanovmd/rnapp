import { agentAuditTitle } from "../agent-audit";

describe("agentAuditTitle", () => {
  it("действие пользователя: что и над чем", () => {
    expect(
      agentAuditTitle({
        type: "agent.action",
        meta: { action: "config.set", worker: "echo", key: "settings" },
      }),
    ).toBe("Агент: запись настройки воркера · echo/settings");
  });

  it("итог от агента: со статусом; незнакомое действие — как есть", () => {
    expect(
      agentAuditTitle({
        type: "agent.action-result",
        meta: {
          action: "worker.restart",
          status: "failed",
          args: { name: "echo" },
        },
      }),
    ).toBe("Агент: перезапуск воркера · echo · не выполнено");
    expect(
      agentAuditTitle({
        type: "agent.action",
        meta: { action: "agent.custom" },
      }),
    ).toBe("Агент: agent.custom");
  });

  it("запрос к воркеру — метод и путь", () => {
    expect(
      agentAuditTitle({
        type: "agent.action",
        meta: {
          action: "fetch",
          worker: "echo",
          method: "POST",
          path: "/echo",
        },
      }),
    ).toBe("Агент: запрос к воркеру · echo POST /echo");
  });

  it("другие события — не про агента", () => {
    expect(
      agentAuditTitle({ type: "auth.login.succeeded", meta: {} }),
    ).toBeNull();
  });
});
