import type { NodeDto } from "@shared/api/gen/main/model";
import type { IActionSheetItem } from "@shared/ui";

import type { INodeAccess } from "./node-access";

/** Действие из меню экрана узла. */
export type TNodeAction =
  | "installCommand"
  | "installSsh"
  | "uninstall"
  | "updateAgent"
  | "rotateKey"
  | "agentPage"
  | "edit"
  | "owner"
  | "delete";

interface INodeActionsState {
  /** Агент на связи и не отозван. */
  agentLive: boolean;
  /** Есть новая версия агента для узла. */
  updateAvailable: boolean;
  /** Есть право на раздел агентов — экран агента открывается. */
  canViewAgents: boolean;
}

/** Пункты меню узла по правам на него и состоянию агента. */
export const nodeActionItems = (
  node: Pick<NodeDto, "agentId" | "agent" | "host">,
  access: INodeAccess,
  state: INodeActionsState,
): IActionSheetItem<TNodeAction>[] => {
  const items: IActionSheetItem<TNodeAction>[] = [];

  if (access.canProvision && !node.agent?.online) {
    items.push({
      key: "installCommand",
      title: "Команда установки",
      description: "Выполнить на узле от root",
      icon: "terminal",
    });
    items.push({
      key: "installSsh",
      title: "Установить по SSH",
      description: node.host ? undefined : "Сначала задайте адрес узла",
      icon: "download",
    });
  }
  if (access.canManage && state.agentLive && state.updateAvailable) {
    items.push({
      key: "updateAgent",
      title: "Обновить агента",
      icon: "upgrade",
    });
  }
  if (access.canManage && state.agentLive) {
    items.push({ key: "rotateKey", title: "Сменить ключ агента", icon: "key" });
  }
  if (state.canViewAgents && node.agentId) {
    items.push({ key: "agentPage", title: "Экран агента", icon: "server" });
  }
  if (access.canUpdate) {
    items.push({ key: "edit", title: "Изменить", icon: "edit" });
  }
  if (access.canAssign) {
    items.push({ key: "owner", title: "Владелец", icon: "user" });
  }
  if (access.canProvision && node.agentId) {
    items.push({
      key: "uninstall",
      title: "Удалить агента",
      description: "По SSH: служба и программа агента",
      icon: "unplug",
      destructive: true,
    });
  }
  if (access.canDelete) {
    items.push({
      key: "delete",
      title: "Удалить узел",
      icon: "trash",
      destructive: true,
    });
  }

  return items;
};
