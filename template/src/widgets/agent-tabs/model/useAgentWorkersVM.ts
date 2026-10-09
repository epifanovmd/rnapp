import {
  agentWorkers,
  fresherPoint,
  IAgentsStore,
  isAgentLive,
  useAgentLiveMetrics,
  workerMetrics,
} from "@entities/agent";
import { useWorkerActions } from "@features/manage-agent";
import type { AgentDto, IAgentWorkerDto } from "@shared/api/gen/main/model";

import { workerRowAccess } from "./worker-access";

/** Строка списка воркеров: воркер, его метрики и ждущая замена. */
export interface IWorkerRow {
  worker: IAgentWorkerDto;
  /** Последний ответ `GET /metrics`; нет — воркер не ответил или метрик не отдаёт. */
  metrics: unknown;
  /**
   * Отложенная замена (`restart` | `update`): из статуса агента или из ответа
   * на действие, пока статус её ещё не показал; нет — `null`.
   */
  pending: string | null;
}

/**
 * Воркеры агента: состояние, самочувствие, отложенная замена и метрики из
 * последней точки; действия — встроенные действия агента.
 */
export const useAgentWorkersVM = (agent: AgentDto, canManage: boolean) => {
  const store = IAgentsStore.useInstance();
  const actions = useWorkerActions();
  const live = useAgentLiveMetrics(agent.id);
  const latest = fresherPoint(live.latest, agent.metrics);

  const pendingOf = (worker: IAgentWorkerDto): string | null =>
    worker.pending ?? store.deferredOf(agent.id, worker.name)?.pending ?? null;

  const updateTargetOf = (worker: IAgentWorkerDto) =>
    store.workerCandidate(agent.id, worker.name)?.target ?? null;

  return {
    agent,
    rows: agentWorkers(agent).map((worker): IWorkerRow => ({
      worker,
      metrics: workerMetrics(latest, worker.name),
      pending: pendingOf(worker),
    })),
    actions,
    accessOf: (worker: IAgentWorkerDto) =>
      workerRowAccess(worker, {
        canManage,
        live: isAgentLive(agent),
        candidate: updateTargetOf(worker),
        pending: pendingOf(worker),
      }),
    updateTargetOf,
  };
};

export type AgentWorkersVM = ReturnType<typeof useAgentWorkersVM>;
