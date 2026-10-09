import type { IAgentActionEvent } from "@entities/agent";

import { workerActionNotice } from "../worker-action-result";

const action = (patch: Partial<IAgentActionEvent> = {}): IAgentActionEvent => ({
  id: "x1",
  agentId: "a1",
  name: "worker.update",
  args: { name: "echo" },
  status: "done",
  result: { version: "1.1.0" },
  createdAt: 1,
  finishedAt: 2,
  deferred: true,
  ...patch,
});

describe("workerActionNotice", () => {
  it("отложенное обновление выполнено — версия в тексте", () => {
    expect(workerActionNotice(action(), "a1")).toEqual({
      ok: true,
      message: "Воркер «echo» обновлён: версия 1.1.0",
    });
  });

  it("отложенный перезапуск не удался — причина и заголовок", () => {
    expect(
      workerActionNotice(
        action({
          name: "worker.restart",
          status: "failed",
          result: undefined,
          error: { code: "E", message: "не запустился" },
        }),
        "a1",
      ),
    ).toEqual({
      ok: false,
      message: "не запустился",
      title: "Воркер «echo» не перезапущен",
    });
  });

  it("чужой агент, замена без ожидания и другие действия — без уведомления", () => {
    expect(workerActionNotice(action(), "a2")).toBeNull();
    expect(workerActionNotice(action(), null)).toBeNull();
    expect(workerActionNotice(action({ deferred: false }), "a1")).toBeNull();
    expect(
      workerActionNotice(action({ name: "agent.update" }), "a1"),
    ).toBeNull();
  });
});

describe("workerActionNotice: имя воркера", () => {
  it("нет имени в событии — берётся из ожидания замены", () => {
    expect(
      workerActionNotice(
        {
          id: "x1",
          agentId: "a1",
          name: "worker.restart",
          status: "done",
          createdAt: 1,
          finishedAt: 2,
          deferred: true,
        },
        "a1",
        "backup",
      )?.message,
    ).toBe("Воркер «backup» перезапущен");
  });
});
