import {
  AGENT_PERMISSIONS,
  IAgentsStore,
  isAgentLive,
  useAgentsRealtime,
} from "@entities/agent";
import { INodesStore, NODE_PERMISSIONS } from "@entities/node";
import { IUserStore } from "@entities/user";
import { type IAgentMenuAccess, useAgentActions } from "@features/manage-agent";
import { ownPermission } from "@shared/lib/access";
import { useEntity } from "@shared/lib/holders";
import { useNavigation } from "@shared/lib/navigation";
import { INotificationService } from "@shared/lib/notifications";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";
import type { IAgentTabsAccess } from "@widgets/agent-tabs";
import { useEffect, useRef } from "react";

/**
 * Экран агента: данные из стора (обновляются событиями), проблемы, сборки,
 * права на вкладки и действия с агентом. Пока экран открыт, сокет в комнате
 * агента — сервер держит наблюдателя: частые метрики и журнал.
 */
export const useAgentDetailVM = (agentId: string) => {
  const store = IAgentsStore.useInstance();
  const nodes = INodesStore.useInstance();
  const userStore = IUserStore.useInstance();
  const toast = INotificationService.useInstance();
  const navigation = useNavigation();
  const canView = userStore.can(AGENT_PERMISSIONS.VIEW);
  const canManage = userStore.can(AGENT_PERMISSIONS.MANAGE);
  const canViewNodes = userStore.can(ownPermission(NODE_PERMISSIONS.VIEW));

  const leftRef = useRef(false);
  const leave = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    if (navigation.canGoBack()) navigation.goBack();
  };

  const card = useEntity<true, string>({
    queryFn: async id => {
      const { error } = await store.fetch(id);

      return error ? { error } : { data: true };
    },
    watch: [agentId],
    enabled: canView,
  });

  useEffect(() => {
    if (!canView) return;
    store.loadAlerts();
    store.loadRelease();
  }, [canView, store]);

  // Узел агента — из списка узлов: переход на экран узла.
  useEffect(() => {
    if (canViewNodes && !nodes.isLoaded) nodes.load();
  }, [canViewNodes, nodes]);

  useAgentsRealtime(canView);
  useSocketRoom("agent", canView ? agentId : null, () => card.refresh(agentId));
  useSocketEvent<[{ id: string }]>(
    "agent:deleted",
    ({ id }) => {
      if (id !== agentId) return;
      toast.warning("Агент удалён");
      leave();
    },
    canView,
  );

  const actions = useAgentActions({ onDeleted: leave });

  const agent = canView ? (store.byId(agentId) ?? null) : null;
  const candidate = store.updateCandidate(agentId);
  const live = !!agent && isAgentLive(agent);

  const menu: IAgentMenuAccess = {
    updateTo: live && canManage && candidate ? candidate.target : null,
    canRotate: live && canManage,
    canRevoke: !!agent && canManage && !agent.revoked,
    canDelete: !!agent && canManage && agent.revoked,
  };

  const reload = async (): Promise<void> => {
    if (!canView) return;
    await Promise.all([
      card.refresh(agentId),
      store.loadAlerts(),
      store.loadRelease(),
    ]);
  };

  return {
    canView,
    agent,
    /** Узел этого агента; нет или нет права на узлы — `null`. */
    node: canViewNodes
      ? (nodes.nodes.find(item => item.agentId === agentId) ?? null)
      : null,
    isError: card.isError && !agent,
    alerts: store.alertsOf(agentId),
    candidate: candidate?.target ?? null,
    actions,
    menu,
    reload,
    /** Права на вкладках — права раздела агентов. */
    access: {
      canManage,
      canConfig: userStore.can(AGENT_PERMISSIONS.CONFIG),
      canFetch: userStore.can(AGENT_PERMISSIONS.FETCH),
      canLogs: userStore.can(AGENT_PERMISSIONS.LOGS),
    } satisfies IAgentTabsAccess,
  };
};

export type AgentDetailVM = ReturnType<typeof useAgentDetailVM>;
