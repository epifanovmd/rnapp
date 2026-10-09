import { configuredWorkers, useAgentEventFeed } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type {
  AgentDto,
  IAgentEventDto,
  IAgentManifestEventDto,
} from "@shared/api/gen/main/model";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";
import { useState } from "react";

/** События задач: агент принимает их от воркера с `jobs` в манифесте. */
const JOB_EVENTS = ["job.progress", "job.done", "job.failed", "job.cancelled"];

/**
 * События воркеров агента, новые первыми: страницы с сервера по курсору (с
 * фильтром по воркеру и типу), новые — `agent:event` из комнаты агента.
 */
export const useAgentEventsVM = (agent: AgentDto) => {
  const api = IMainApi.useInstance();
  const [worker, setWorker] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const key = `${agent.id}/${worker ?? ""}/${type ?? ""}`;

  const feed = useAgentEventFeed(
    (cursor, limit) =>
      api.getAgentEvents({
        agentId: agent.id,
        worker: worker ?? undefined,
        type: type ?? undefined,
        cursor,
        limit,
      }),
    key,
  );

  useSocketRoom("agent", agent.id, () => feed.load());
  useSocketEvent<[IAgentEventDto]>("agent:event", event => {
    if (
      event.agentId === agent.id &&
      (!worker || event.worker === worker) &&
      (!type || event.type === type)
    ) {
      feed.prepend(event);
    }
  });

  const workers = configuredWorkers(agent);
  // Типы — объявленные в манифестах (других агент не принимает).
  const declared = workers
    .filter(item => !worker || item.name === worker)
    .flatMap(item => [
      ...(item.manifest?.events ?? []),
      ...(item.manifest?.jobs.length
        ? JOB_EVENTS.map(jobType => ({ type: jobType }))
        : []),
    ]);
  const types = [...new Set(declared.map(event => event.type))].sort();
  const declaration: IAgentManifestEventDto | null =
    (type && declared.find(event => event.type === type)) || null;

  return {
    feed,
    worker,
    setWorker: (next: string | null) => {
      setWorker(next);
      setType(null);
    },
    type,
    setType,
    workerOptions: workers.map(item => item.name),
    typeOptions: types,
    /** Объявление выбранного типа в манифесте: описание и схема `data`. */
    declaration,
  };
};

export type AgentEventsVM = ReturnType<typeof useAgentEventsVM>;
