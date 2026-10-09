import type { NodeDto } from "@shared/api/gen/main/model";
import type { IActionSheetItem } from "@shared/ui";

/** Действие с узлом из меню списка. */
export type TNodeListAction =
  "provision" | "uninstall" | "owner" | "edit" | "delete";

/** Действия над узлом по области прав. */
export interface INodeRowAccess {
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canProvision: boolean;
}

/** Пункты меню узла в списке по правам на него. */
export const nodeListActionItems = (
  node: Pick<NodeDto, "agentId" | "agent">,
  access: INodeRowAccess,
): IActionSheetItem<TNodeListAction>[] => {
  const items: IActionSheetItem<TNodeListAction>[] = [];

  if (access.canProvision && !node.agent?.online) {
    items.push({
      key: "provision",
      title: "Установить агента",
      icon: "download",
    });
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
  if (access.canAssign) {
    items.push({ key: "owner", title: "Владелец", icon: "user" });
  }
  if (access.canUpdate) {
    items.push({ key: "edit", title: "Изменить", icon: "edit" });
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
