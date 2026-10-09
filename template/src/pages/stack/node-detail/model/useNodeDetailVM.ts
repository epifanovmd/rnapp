import {
  AGENT_PERMISSIONS,
  IAgentsStore,
  isAgentLive,
  useAgentsRealtime,
} from "@entities/agent";
import {
  INodesStore,
  NODE_PERMISSIONS,
  nodeAddressMismatch,
  nodeOwners,
} from "@entities/node";
import { IUserStore } from "@entities/user";
import { useAssignNodeOwnerVM } from "@features/assign-node-owner";
import { useAgentActions } from "@features/manage-agent";
import { useDeleteNode, useNodeFormVM } from "@features/manage-node";
import { useProvisionNodeAgentVM } from "@features/provision-node-agent";
import { IMainApi } from "@shared/api";
import type {
  AgentAlertDto,
  AgentDto,
  JobRunDto,
  NodeDto,
} from "@shared/api/gen/main/model";
import { useEntity } from "@shared/lib/holders";
import { useCloseWhenForbidden } from "@shared/lib/hooks";
import { useNavigation } from "@shared/lib/navigation";
import { INotificationService } from "@shared/lib/notifications";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";
import type { IAgentTabsAccess } from "@widgets/agent-tabs";
import { useEffect, useRef } from "react";

import { nodeAccess } from "./node-access";

/**
 * Экран узла: узел и его агент из сторов (обновляются событиями комнат узла
 * и агента), последняя задача установки, действия. Агент показывается, только
 * пока он агент этого узла: отвязанный или удалённый — не показывается. Права
 * на действия — по области прав на этот узел (свой — владелец или создатель)
 * и правам раздела агентов.
 */
export const useNodeDetailVM = (nodeId: string) => {
  const api = IMainApi.useInstance();
  const store = INodesStore.useInstance();
  const agents = IAgentsStore.useInstance();
  const userStore = IUserStore.useInstance();
  const toast = INotificationService.useInstance();
  const navigation = useNavigation();
  const canView = userStore.scope(NODE_PERMISSIONS.VIEW) !== null;
  const canViewAgents = userStore.can(AGENT_PERMISSIONS.VIEW);

  // Удаление приходит и ответом, и событием сокета — уходим один раз.
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
    watch: [nodeId],
    enabled: canView,
  });

  const node = canView ? (store.byId(nodeId) ?? null) : null;
  const agentId = node?.agentId ?? null;
  const jobId = node?.job?.id ?? null;
  const owners = node ? nodeOwners(node) : [];
  const access = nodeAccess({
    canOnNode: permission => !!node && userStore.canOn(permission, owners),
    canAgents: permission => userStore.can(permission),
  });

  const agentCard = useEntity<true, string>({
    queryFn: async id => {
      const { error } = await agents.fetch(id);

      return error ? { error } : { data: true };
    },
    watch: [agentId ?? ""],
    enabled: !!agentId,
  });

  // Задача установки целиком (с журналом); дальше — `job:updated`.
  const job = useEntity<JobRunDto, string>({
    queryFn: id => api.getJob(id),
    watch: [jobId ?? ""],
    enabled: !!jobId,
  });

  useEffect(() => {
    if (!agentId) return;
    agents.loadAlerts();
    // Сборки — только с правом на агентов: из них версия обновления.
    if (canViewAgents) agents.loadRelease();
  }, [agentId, agents, canViewAgents]);

  useSocketRoom("node", canView ? nodeId : null, () => card.refresh(nodeId));
  // Комната агента: сервер держит наблюдателя — частые метрики и журнал.
  useSocketRoom("agent", agentId, () => {
    if (agentId) agentCard.refresh(agentId);
  });
  // Комната агентов: новая версия агента — уведомлением.
  useAgentsRealtime(canViewAgents);
  useSocketEvent<[NodeDto]>(
    "node:updated",
    next => {
      if (next.id === nodeId) store.upsert(next);
    },
    canView,
  );
  useSocketEvent<[{ id: string }]>(
    "node:deleted",
    ({ id }) => {
      if (id !== nodeId) return;
      store.remove(id);
      toast.warning("Узел удалён или больше недоступен");
      leave();
    },
    canView,
  );
  useSocketEvent<[AgentDto]>(
    "agent:updated",
    next => {
      if (next.id === agentId) agents.upsert(next);
    },
    !!agentId,
  );
  useSocketEvent<[AgentAlertDto]>(
    "agent:alert",
    alert => {
      if (alert.agentId === agentId) agents.applyAlert(alert);
    },
    !!agentId,
  );
  useSocketEvent<[JobRunDto]>(
    "job:updated",
    next => {
      if (next.id === jobId) job.setData(next);
    },
    !!jobId,
  );

  const form = useNodeFormVM({ onSaved: store.upsert });
  const owner = useAssignNodeOwnerVM({ onSaved: store.upsert });
  const provision = useProvisionNodeAgentVM({
    onStarted: () => card.refresh(nodeId),
  });
  const removeNode = useDeleteNode({
    onDeleted: deleted => {
      store.remove(deleted.id);
      leave();
    },
  });
  const agentActions = useAgentActions();

  // Агент из стора — только агент этого узла.
  const stored = agentId ? agents.byId(agentId) : undefined;
  const agent = stored && stored.id === agentId ? stored : null;
  const agentLive = !!agent && isAgentLive(agent);

  useCloseWhenForbidden(form.open, access.canUpdate, () => form.setOpen(false));
  useCloseWhenForbidden(owner.open, access.canAssign, owner.close);
  useCloseWhenForbidden(provision.open, access.canProvision, provision.close);

  /** Pull-to-refresh: узел, агент, задача и сборки агента. */
  const reload = async (): Promise<void> => {
    if (!canView) return;
    await Promise.all([
      card.refresh(nodeId),
      agentId ? agentCard.refresh(agentId) : undefined,
      jobId ? job.refresh(jobId) : undefined,
      agentId ? agents.loadAlerts() : undefined,
      canViewAgents ? agents.loadRelease() : undefined,
    ]);
  };

  const tabsAccess: IAgentTabsAccess = {
    canManage: access.canManage,
    canConfig: access.canConfig,
    canFetch: access.canFetch,
    canLogs: access.canLogs,
  };

  return {
    canView,
    canViewAgents,
    node,
    isError: card.isError && !node,
    agent,
    agentLive,
    isAgentLoading: !!agentId && !agent && !agentCard.isError,
    isAgentError: !!agentId && !agent && agentCard.isError,
    alerts: agentId ? agents.alertsOf(agentId) : [],
    /** Последняя задача установки или удаления целиком, если загружена. */
    job: job.data?.id === jobId ? job.data : null,
    addressMismatch: node ? nodeAddressMismatch(node) : false,
    /** Есть новая версия агента для узла (сервер считает по сборкам). */
    updateAvailable: !!node?.agent?.updateAvailable,
    /** Новая версия для обновления; без права видеть сборки — неизвестна. */
    updateTarget: agentId
      ? (agents.updateCandidate(agentId)?.target ?? null)
      : null,
    access,
    tabsAccess,
    form,
    owner,
    provision,
    removeNode,
    agentActions,
    reload,
  };
};

export type NodeDetailVM = ReturnType<typeof useNodeDetailVM>;
