import { IChatMessage, isMessageEditable } from "@entities/message";
import { ContextMenuAction } from "@shared/ui";

/** Действие над сообщением. */
export type MessageActionId = "reply" | "edit" | "delete";

const MESSAGE_ACTION_IDS: readonly string[] = [
  "reply",
  "edit",
  "delete",
] satisfies MessageActionId[];

/** Id пункта меню — действие над сообщением. */
export const isMessageActionId = (id: string): id is MessageActionId =>
  MESSAGE_ACTION_IDS.includes(id);

/**
 * Набор пунктов меню для сообщения.
 *
 * Правка и удаление — только своих: правило одно на всё приложение, и живёт
 * оно здесь, а не в разметке строки.
 */
export const buildMessageActions = (
  message: IChatMessage,
): ContextMenuAction[] => {
  const actions: ContextMenuAction[] = [
    { id: "reply", title: "Ответить", systemImage: "arrowshape.turn.up.left" },
  ];

  if (message.isOwn) {
    // Правится не всякое своё сообщение: правимость решает вид содержимого.
    if (isMessageEditable(message)) {
      actions.push({ id: "edit", title: "Изменить", systemImage: "pencil" });
    }

    actions.push({
      id: "delete",
      title: "Удалить",
      systemImage: "trash",
      isDestructive: true,
    });
  }

  return actions;
};
