import { EJobRunStatus } from "@shared/api/gen/main/model";

export const JOB_STATUS_LABEL: Record<EJobRunStatus, string> = {
  [EJobRunStatus.queued]: "В очереди",
  [EJobRunStatus.running]: "Выполняется",
  [EJobRunStatus.completed]: "Готово",
  [EJobRunStatus.failed]: "Ошибка",
  [EJobRunStatus.cancelled]: "Отменена",
};

/** Задача ещё не завершилась — её можно отменить. */
export const isJobActive = (status: EJobRunStatus): boolean =>
  status === EJobRunStatus.queued || status === EJobRunStatus.running;
