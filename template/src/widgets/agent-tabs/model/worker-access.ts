import type { IAgentWorkerDto } from "@shared/api/gen/main/model";

/** Действия над воркером в строке списка. */
export interface IWorkerRowAccess {
  canRestart: boolean;
  /** Версия выпуска, до которой можно обновить; нельзя — `null`. */
  updateTo: string | null;
  /** Воркер занят или замена ждёт его — можно заменить сразу. */
  canReplaceNow: boolean;
}

/**
 * Действия над воркером: с правом и на связи; встроенный воркер — часть
 * агента, его не трогаем. Обновить — только воркер из выпуска с кандидатом.
 */
export const workerRowAccess = (
  worker: Pick<IAgentWorkerDto, "builtin" | "release" | "health">,
  options: {
    canManage: boolean;
    live: boolean;
    /** Версия кандидата на обновление из выпуска. */
    candidate: string | null;
    /** Ждущая замена (`restart` | `update`). */
    pending: string | null;
  },
): IWorkerRowAccess => {
  const can = options.canManage && options.live && !worker.builtin;

  return {
    canRestart: can,
    updateTo: can && worker.release ? options.candidate : null,
    canReplaceNow: can && (!!options.pending || !!worker.health?.busy),
  };
};
