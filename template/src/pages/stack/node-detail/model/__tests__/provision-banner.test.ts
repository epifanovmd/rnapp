import type { INodeJobDto } from "@shared/api/gen/main/model";

import { provisionBanner } from "../provision-banner";

const job = (patch: Partial<INodeJobDto> = {}): INodeJobDto => ({
  id: "j1",
  kind: "install",
  status: "running",
  progress: 0.4,
  progressText: "Скачивание",
  error: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  finishedAt: null,
  ...patch,
});

describe("provisionBanner", () => {
  it("идёт: ход из полной задачи свежее сводки", () => {
    expect(
      provisionBanner(
        job(),
        {
          status: "running",
          progress: 0.7,
          progressText: "Запуск службы",
          error: null,
          logTail: [],
        },
        "provisioning",
        false,
      ),
    ).toEqual({
      kind: "active",
      uninstall: false,
      progress: 0.7,
      text: "Запуск службы",
      queued: false,
    });
  });

  it("провал установки — пока узел в ошибке; удаления — всегда", () => {
    const failed = job({
      status: "failed",
      error: { message: "SSH: доступ запрещён", code: "SSH" },
    });

    expect(provisionBanner(failed, null, "error", false)).toMatchObject({
      kind: "failed",
      message: "SSH: доступ запрещён",
    });
    expect(provisionBanner(failed, null, "created", false)).toBeNull();
    expect(
      provisionBanner({ ...failed, kind: "uninstall" }, null, "online", true),
    ).toMatchObject({ kind: "failed", uninstall: true });
  });

  it("установлен, но агент ещё не на связи", () => {
    expect(
      provisionBanner(
        job({ status: "completed" }),
        null,
        "provisioning",
        false,
      ),
    ).toEqual({ kind: "installed" });
    expect(
      provisionBanner(job({ status: "completed" }), null, "online", true),
    ).toBeNull();
    expect(provisionBanner(null, null, "created", false)).toBeNull();
  });
});
