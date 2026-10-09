import {
  AGENT_PERMISSIONS,
  IAgentsStore,
  isAgentLive,
  useAgentsRealtime,
} from "@entities/agent";
import { IUserStore } from "@entities/user";
import { useEnrollAgentVM } from "@features/enroll-agent";
import { type IAgentMenuAccess, useAgentActions } from "@features/manage-agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { useCloseWhenForbidden } from "@shared/lib/hooks";
import { useEffect, useState } from "react";

import { filterAgents, type TAgentFilter } from "./agent-filter";

/**
 * Агенты с их проблемами и сборками для обновления; отбор и поиск, действия
 * с агентом и установка нового. Данные и комната `agents` — только с правом
 * просмотра.
 */
export const useAgentsVM = () => {
  const store = IAgentsStore.useInstance();
  const userStore = IUserStore.useInstance();
  const canView = userStore.can(AGENT_PERMISSIONS.VIEW);
  const canManage = userStore.can(AGENT_PERMISSIONS.MANAGE);
  const canEnroll = userStore.can(AGENT_PERMISSIONS.ENROLL);
  const [filter, setFilter] = useState<TAgentFilter>("all");
  const [query, setQuery] = useState("");
  const [isRefreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!canView) return;
    store.load();
    store.loadAlerts();
    store.loadRelease();
  }, [canView, store]);
  useAgentsRealtime(canView);

  const actions = useAgentActions();
  const install = useEnrollAgentVM();

  useCloseWhenForbidden(install.open, canEnroll, () => install.setOpen(false));

  const updateTarget = (agent: AgentDto) =>
    store.updateCandidate(agent.id)?.target ?? null;

  const accessOf = (agent: AgentDto): IAgentMenuAccess => {
    const live = canManage && isAgentLive(agent);

    return {
      updateTo: live ? updateTarget(agent) : null,
      canRotate: live,
      canRevoke: canManage && !agent.revoked,
      canDelete: canManage && agent.revoked,
    };
  };

  const reload = async () => {
    if (!canView) return;
    setRefreshing(true);
    await Promise.all([store.load(), store.loadAlerts(), store.loadRelease()]);
    setRefreshing(false);
  };

  return {
    canView,
    canEnroll,
    agents: filterAgents(store.agents, filter, query, {
      hasAlerts: id => store.alertsOf(id).length > 0,
      hasUpdate: id => !!store.updateCandidate(id),
    }),
    total: store.agents.length,
    isLoading: store.isLoading,
    isRefreshing,
    error: store.error,
    alerts: store.alerts,
    alertsOf: store.alertsOf,
    filter,
    setFilter,
    query,
    setQuery,
    updateTarget,
    accessOf,
    actions,
    install,
    reload,
  };
};

export type AgentsVM = ReturnType<typeof useAgentsVM>;
