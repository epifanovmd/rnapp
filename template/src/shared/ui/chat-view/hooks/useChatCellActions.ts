import { RefObject, useMemo, useRef } from "react";
import { Keyboard } from "react-native";

import { IChatCellActions } from "../model";
import { ChatViewProps } from "../types";
import { IChatScrollControl } from "./useChatScrollControl";

/**
 * Маршрутизация действий ячейки в колбэки хоста.
 *
 * Обработчики отдаются ячейкам через ref, чтобы они оставались мемоизированными:
 * пересоздание набора не должно перерисовывать тысячи строк.
 */
export interface IChatCellActionsOptions {
  props: RefObject<ChatViewProps>;
  scrollControl: IChatScrollControl;
  /** Заморозить нижнюю зону перед показом меню. */
  freezeKeyboard: () => void;
  /** Отпустить зону после закрытия меню. */
  restoreKeyboard: () => void;
}

export const useChatCellActions = ({
  props,
  scrollControl,
  freezeKeyboard,
  restoreKeyboard,
}: IChatCellActionsOptions): RefObject<IChatCellActions> => {
  const actions = useMemo<IChatCellActions>(
    () => ({
      // Тап по чату всегда убирает клавиатуру. Пустую область берёт на себя
      // `keyboardShouldPersistTaps` списка.
      onTapMessage: (messageId, attachmentIndex) => {
        Keyboard.dismiss();
        props.current.onMessagePress?.(
          attachmentIndex != null
            ? { messageId, attachmentIndex }
            : { messageId },
        );
      },

      // Выбор эмодзи/действия закрывает меню без onDismiss, поэтому зону
      // размораживаем здесь же (restore идемпотентен).
      onEmojiSelect: (emoji, messageId) => {
        restoreKeyboard();
        props.current.onEmojiReactionSelect?.({ emoji, messageId });
      },
      onActionSelect: (actionId, messageId) => {
        restoreKeyboard();
        props.current.onActionPress?.({ actionId, messageId });
      },

      // Тап по цитате уводит к оригиналу.
      onReplyTap: replyToId => {
        scrollControl.scrollToMessage(replyToId, {
          position: "center",
          animated: true,
          highlight: true,
        });
        props.current.onReplyMessagePress?.({ messageId: replyToId });
      },

      onReactionTap: (messageId, emoji) =>
        props.current.onReactionTap?.({ emoji, messageId }),
      onThreadTap: (messageId, threadId) =>
        props.current.onThreadTap?.({ messageId, threadId }),
      onLinkTap: (url, messageId) =>
        props.current.onLinkTap?.({ url, messageId }),
      onPhoneNumberTap: (phoneNumber, messageId) =>
        props.current.onPhoneNumberTap?.({ phoneNumber, messageId }),
      onPollOptionTap: (messageId, pollId, optionId) =>
        props.current.onPollOptionPress?.({ messageId, pollId, optionId }),
      onPollDetailTap: (messageId, pollId) =>
        props.current.onPollDetailPress?.({ messageId, pollId }),

      // Клавиатуру убирает сам freeze — вместе с фиксацией зоны, чтобы меню
      // успело снять снапшот пузыря по неподвижному лейауту.
      onContextMenuWillShow: () => freezeKeyboard(),
      onContextMenuDismiss: () => restoreKeyboard(),
    }),
    [props, scrollControl, freezeKeyboard, restoreKeyboard],
  );

  const ref = useRef(actions);

  ref.current = actions;

  return ref;
};
