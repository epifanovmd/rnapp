import type { AgentDto } from "@shared/api/gen/main/model";

/** Отбор агентов по состоянию. */
export type TAgentFilter =
  "all" | "online" | "offline" | "problems" | "updates";

export const AGENT_FILTER_LABELS: Record<TAgentFilter, string> = {
  all: "Все",
  online: "На связи",
  offline: "Без связи",
  problems: "С проблемами",
  updates: "Обновление",
};

/** Что известно об агенте, кроме него самого. */
export interface IAgentFilterContext {
  /** Есть активные проблемы. */
  hasAlerts: (agentId: string) => boolean;
  /** Есть версия выпуска для обновления. */
  hasUpdate: (agentId: string) => boolean;
}

/** Агенты по отбору и поиску (имя, узел, адрес, метки). */
export const filterAgents = (
  agents: AgentDto[],
  filter: TAgentFilter,
  query: string,
  context: IAgentFilterContext,
): AgentDto[] => {
  const text = query.trim().toLowerCase();

  return agents.filter(agent => {
    const live = agent.online && !agent.revoked;

    if (filter === "online" && !live) return false;
    if (filter === "offline" && live) return false;
    if (filter === "problems" && !context.hasAlerts(agent.id)) return false;
    if (filter === "updates" && !context.hasUpdate(agent.id)) return false;
    if (!text) return true;

    return [
      agent.name,
      agent.host?.hostname,
      agent.address,
      ...Object.entries(agent.labels).map(([key, value]) => `${key}=${value}`),
    ].some(value => value?.toLowerCase().includes(text));
  });
};
