import {
  AGENT_PERMISSIONS,
  IAgentsStore,
  useAgentsRealtime,
} from "@entities/agent";
import {
  countNodes,
  filterNodes,
  type INodeFilter,
  INodesStore,
  NODE_PERMISSIONS,
  nodeOwners,
  useNodesRealtime,
} from "@entities/node";
import { IUserStore } from "@entities/user";
import { useAssignNodeOwnerVM } from "@features/assign-node-owner";
import { useDeleteNode, useNodeFormVM } from "@features/manage-node";
import { useProvisionNodeAgentVM } from "@features/provision-node-agent";
import { IMainApi } from "@shared/api";
import type {
  IAgentMetricsPointDto,
  INodeMeshDto,
  NodeDto,
} from "@shared/api/gen/main/model";
import { useEntity } from "@shared/lib/holders";
import { useCloseWhenForbidden } from "@shared/lib/hooks";
import { useSocketEvent } from "@shared/lib/socket";
import { useEffect, useRef, useState } from "react";

import { meshKey } from "./mesh";
import type { INodeRowAccess } from "./node-actions";

/**
 * Узлы: список с поиском и «Мои», связность, нагрузка и действия. С областью
 * «свои» — только свои узлы (владелец или создатель); действия — по узлу.
 * Связность и нагрузка — снимок, дальше события (`node:mesh`, `node:load`).
 * С правом на агентов — ещё комната агентов: новая версия агента приходит
 * уведомлением.
 */
export const useNodesVM = () => {
  const api = IMainApi.useInstance();
  const userStore = IUserStore.useInstance();
  const store = INodesStore.useInstance();
  const agents = IAgentsStore.useInstance();
  const viewScope = userStore.scope(NODE_PERMISSIONS.VIEW);
  const canView = viewScope !== null;
  const canViewAgents = userStore.can(AGENT_PERMISSIONS.VIEW);
  const canCreate = userStore.can(NODE_PERMISSIONS.CREATE);
  const [filter, setFilter] = useState<INodeFilter>({ query: "", mine: false });
  const [isRefreshing, setRefreshing] = useState(false);

  const accessOf = (node: NodeDto): INodeRowAccess => {
    const owners = nodeOwners(node);

    return {
      canUpdate: userStore.canOn(NODE_PERMISSIONS.UPDATE, owners),
      canDelete: userStore.canOn(NODE_PERMISSIONS.DELETE, owners),
      canAssign: userStore.canOn(NODE_PERMISSIONS.ASSIGN, owners),
      canProvision: userStore.canOn(NODE_PERMISSIONS.PROVISION, owners),
    };
  };

  const form = useNodeFormVM({ onSaved: store.upsert });
  const remove = useDeleteNode({ onDeleted: node => store.remove(node.id) });
  const owner = useAssignNodeOwnerVM({ onSaved: store.upsert });
  const provision = useProvisionNodeAgentVM();

  const mesh = useEntity<INodeMeshDto>({
    queryFn: () => api.getNodeMesh(),
    autoLoad: true,
    enabled: canView,
  });

  useEffect(() => {
    if (!canView) return;
    store.load();
  }, [canView, store]);

  useEffect(() => {
    if (!canViewAgents) return;
    // Нагрузка — снимок из метрик агентов, дальше `node:load`.
    agents.load();
    agents.loadRelease();
  }, [canViewAgents, agents]);

  useNodesRealtime(viewScope);
  useAgentsRealtime(canViewAgents);
  useSocketEvent<[INodeMeshDto]>("node:mesh", mesh.setData, canView);

  // Узел добавлен, удалён или переименован — состав матрицы перечитывается.
  const nodesKey = meshKey(store.nodes);
  const shownKey = useRef<string | null>(null);
  const meshHolder = mesh.holder;

  useEffect(() => {
    if (!canView || !store.isLoaded) return;
    if (shownKey.current !== null && shownKey.current !== nodesKey) {
      meshHolder.refresh();
    }
    shownKey.current = nodesKey;
  }, [canView, store.isLoaded, nodesKey, meshHolder]);

  /** Последняя нагрузка узла: событие `node:load` или метрики агента из списка. */
  const loadOf = (node: NodeDto): IAgentMetricsPointDto | null => {
    const live = store.loadOf(node.id);
    const fromAgent = node.agentId
      ? agents.byId(node.agentId)?.metrics
      : undefined;
    const fromEvent =
      live && live.agentId === node.agentId ? live.point : undefined;

    if (fromEvent && (!fromAgent || fromEvent.at >= fromAgent.at)) {
      return fromEvent;
    }

    return fromAgent ?? null;
  };

  useCloseWhenForbidden(
    form.open,
    form.editing ? accessOf(form.editing).canUpdate : canCreate,
    () => form.setOpen(false),
  );
  useCloseWhenForbidden(
    owner.open,
    !!owner.node && accessOf(owner.node).canAssign,
    owner.close,
  );
  useCloseWhenForbidden(
    provision.open,
    !!provision.node && accessOf(provision.node).canProvision,
    provision.close,
  );

  /** Pull-to-refresh: список, связность, агенты и выпуск. */
  const reload = async () => {
    if (!canView) return;
    setRefreshing(true);
    await Promise.all([
      store.load(),
      mesh.refresh(),
      canViewAgents ? agents.load() : null,
      canViewAgents ? agents.loadRelease() : null,
    ]);
    setRefreshing(false);
  };

  return {
    canView,
    /** Можно смотреть все узлы — фильтр «Мои» имеет смысл. */
    canViewAll: viewScope === "all",
    canCreate,
    nodes: filterNodes(store.nodes, filter, userStore.user?.id ?? null),
    counts: countNodes(store.nodes),
    isLoading: store.isLoading,
    isRefreshing,
    error: store.error,
    filter,
    setQuery: (query: string) => setFilter(prev => ({ ...prev, query })),
    setMine: (mine: boolean) => setFilter(prev => ({ ...prev, mine })),
    mesh: mesh.data,
    loadOf,
    reload,
    form,
    remove,
    owner,
    provision,
    accessOf,
  };
};

export type NodesVM = ReturnType<typeof useNodesVM>;
