import {
  agentConnection,
  configStateView,
  isWorkerTroubled,
  workerHealthView,
  workerPendingView,
  workerStateView,
} from "../status";
import { makeAgent, makeWorker } from "./agent-fixture";

describe("agent status", () => {
  it("связь: отзыв важнее связи", () => {
    expect(agentConnection(makeAgent())).toBe("online");
    expect(agentConnection(makeAgent({ online: false }))).toBe("offline");
    expect(agentConnection(makeAgent({ revoked: true }))).toBe("revoked");
  });

  it("состояния воркера; незнакомое — как есть, серым", () => {
    expect(workerStateView("invalid")).toEqual({
      label: "не зарегистрирован",
      variant: "destructive",
    });
    expect(workerStateView("paused")).toEqual({
      label: "paused",
      variant: "muted",
    });
  });

  it("самочувствие: нет ответа — нет бейджа, занят — отдельно", () => {
    expect(workerHealthView(makeWorker({ health: undefined }))).toBeNull();
    expect(workerHealthView(makeWorker())?.label).toBe("в порядке");
    expect(
      workerHealthView(makeWorker({ health: { ok: true, busy: true } }))?.label,
    ).toBe("занят");
    expect(
      workerHealthView(makeWorker({ health: { ok: false, busy: true } }))
        ?.label,
    ).toBe("не в порядке");
  });

  it("неполадка — не работает или сам сообщил; занятость — не неполадка", () => {
    expect(isWorkerTroubled(makeWorker())).toBe(false);
    expect(
      isWorkerTroubled(makeWorker({ health: { ok: true, busy: true } })),
    ).toBe(false);
    expect(isWorkerTroubled(makeWorker({ health: { ok: false } }))).toBe(true);
    expect(isWorkerTroubled(makeWorker({ state: "starting" }))).toBe(true);
  });

  it("отложенная замена и статус настройки", () => {
    expect(workerPendingView("update").label).toBe(
      "обновление — когда освободится",
    );
    expect(configStateView("applied").variant).toBe("success");
    expect(configStateView("failed").label).toBe("ошибка");
  });
});
