import type { IActionSheetItem } from "@shared/ui";

/** Действие с агентом из меню. */
export type TAgentMenuAction = "update" | "rotate" | "revoke" | "delete";

/** Что можно сделать с агентом: считает экран по правам и состоянию агента. */
export interface IAgentMenuAccess {
  /** Версия выпуска, до которой можно обновить; нельзя — `null`. */
  updateTo: string | null;
  canRotate: boolean;
  canRevoke: boolean;
  canDelete: boolean;
}

/** Пункты меню действий с агентом. */
export const agentActionItems = (
  access: IAgentMenuAccess,
): IActionSheetItem<TAgentMenuAction>[] => {
  const items: IActionSheetItem<TAgentMenuAction>[] = [];

  if (access.updateTo) {
    items.push({
      key: "update",
      title: `Обновить до ${access.updateTo}`,
      description: "Агент скачает новую версию и перезапустится",
      icon: "upgrade",
    });
  }
  if (access.canRotate) {
    items.push({ key: "rotate", title: "Сменить ключ", icon: "key" });
  }
  if (access.canRevoke) {
    items.push({
      key: "revoke",
      title: "Отозвать",
      description: "Ключ агента перестанет приниматься",
      icon: "ban",
      destructive: true,
    });
  }
  if (access.canDelete) {
    items.push({
      key: "delete",
      title: "Удалить",
      icon: "trash",
      destructive: true,
    });
  }

  return items;
};
