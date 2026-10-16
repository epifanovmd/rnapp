import type { IChatMessage } from "@entities/message";
import type { InputBarInputAction } from "@shared/ui/input-bar";

/**
 * Действие панели ввода ссылается на сообщение, которого больше нет (удалено):
 * ответ или правка такого сообщения ушли бы в никуда.
 */
export const isInputActionOrphaned = (
  action: InputBarInputAction | null,
  messagesById: ReadonlyMap<string, IChatMessage>,
): boolean =>
  !!action?.messageId &&
  action.type !== "none" &&
  !messagesById.has(action.messageId);
