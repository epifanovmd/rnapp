import type {
  ENodeStatus,
  INodeJobDto,
  JobRunDto,
} from "@shared/api/gen/main/model";

/** Что показать о задаче агента узла: ход, провал или «агент установлен». */
export type TProvisionBanner =
  | {
      kind: "active";
      uninstall: boolean;
      progress: number;
      text: string | null;
      queued: boolean;
    }
  | { kind: "failed"; uninstall: boolean; message: string; logTail: string[] }
  | { kind: "installed" };

/** Строк журнала задачи в сообщении о провале. */
const LOG_TAIL_LINES = 12;

/**
 * Баннер последней задачи установки или удаления агента. Полная задача
 * (`run`, с журналом) свежее сводки узла, когда уже пришла событием. Провал
 * установки — пока узел в ошибке; провал удаления — всегда; «агент
 * установлен» — пока агент не вышел на связь.
 */
export const provisionBanner = (
  job: INodeJobDto | null,
  run: Pick<
    JobRunDto,
    "status" | "progress" | "progressText" | "error" | "logTail"
  > | null,
  nodeStatus: ENodeStatus,
  agentOnline: boolean,
): TProvisionBanner | null => {
  if (!job) return null;

  const status = run?.status ?? job.status;
  const uninstall = job.kind === "uninstall";

  if (status === "queued" || status === "running") {
    return {
      kind: "active",
      uninstall,
      progress: run?.progress ?? job.progress,
      text: run?.progressText ?? job.progressText,
      queued: status === "queued",
    };
  }
  if (status === "failed" || status === "cancelled") {
    if (!uninstall && nodeStatus !== "error") return null;

    return {
      kind: "failed",
      uninstall,
      message: (run?.error ?? job.error)?.message ?? "Задача отменена",
      logTail: run?.logTail.slice(-LOG_TAIL_LINES) ?? [],
    };
  }
  if (
    status === "completed" &&
    !uninstall &&
    !agentOnline &&
    nodeStatus !== "online"
  ) {
    return { kind: "installed" };
  }

  return null;
};
