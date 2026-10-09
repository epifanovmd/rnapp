import { AGENT_PERMISSIONS } from "@entities/agent";
import { NODE_PERMISSIONS } from "@entities/node";

/** Права на действия с узлом и его агентом. */
export interface INodeAccess {
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canProvision: boolean;
  /** Агент узла: обновление, ключ, воркеры, настройки, запросы. */
  canManage: boolean;
  /** Значения настроек воркеров. */
  canConfig: boolean;
  canFetch: boolean;
  canLogs: boolean;
}

/** Права пользователя, нужные экрану узла. */
export interface INodeAccessInput {
  /** Право узла на этот узел (на все или на свой). */
  canOnNode: (permission: string) => boolean;
  /** Право раздела агентов (на всех агентов). */
  canAgents: (permission: string) => boolean;
}

/**
 * Права на узел и его агента: агент узла доступен по правам узла
 * (`node:agent`, `node:logs`) или по правам раздела агентов — как решает
 * сервер.
 */
export const nodeAccess = ({
  canOnNode,
  canAgents,
}: INodeAccessInput): INodeAccess => {
  const canAgent = canOnNode(NODE_PERMISSIONS.AGENT);

  return {
    canUpdate: canOnNode(NODE_PERMISSIONS.UPDATE),
    canDelete: canOnNode(NODE_PERMISSIONS.DELETE),
    canAssign: canOnNode(NODE_PERMISSIONS.ASSIGN),
    canProvision: canOnNode(NODE_PERMISSIONS.PROVISION),
    canManage: canAgent || canAgents(AGENT_PERMISSIONS.MANAGE),
    canConfig: canAgent || canAgents(AGENT_PERMISSIONS.CONFIG),
    canFetch: canAgent || canAgents(AGENT_PERMISSIONS.FETCH),
    canLogs:
      canOnNode(NODE_PERMISSIONS.LOGS) || canAgents(AGENT_PERMISSIONS.LOGS),
  };
};
