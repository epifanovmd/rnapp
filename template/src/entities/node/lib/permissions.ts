import type { NodeDto } from "@shared/api/gen/main/model";

/**
 * Права узлов. Все, кроме создания, бывают «на все» и «на свои» (`…:own`:
 * владелец или создатель узла). Права на агента узла (`node:view`,
 * `node:agent`, `node:logs`) открывают и агента этого узла.
 */
export const NODE_PERMISSIONS = {
  /** Узлы, их агенты, метрики и связность. */
  VIEW: "node:view",
  CREATE: "node:create",
  UPDATE: "node:update",
  DELETE: "node:delete",
  /** Назначение и снятие владельца. */
  ASSIGN: "node:assign",
  /** Установка и удаление агента: команда установки и SSH. */
  PROVISION: "node:provision",
  /** Агент узла: обновление, ключ, воркеры, их настройки и запросы к ним. */
  AGENT: "node:agent",
  /** Журнал агента узла. */
  LOGS: "node:logs",
} as const;

/** Кому узел «свой»: назначенный владелец и создатель. */
export const nodeOwners = (
  node: Pick<NodeDto, "ownerId" | "createdById">,
): Array<string | null> => [node.ownerId, node.createdById];
