import { RefObject, useMemo, useRef } from "react";
import { Keyboard } from "react-native";

import { IChatCellDelegate } from "../components/chat-view-context";
import { ChatViewProps } from "../types";
import { IChatCommands } from "./useChatCommands";

/**
 * Маршрутизация действий ячеек в колбэки хоста.
 *
 * Делегат отдаётся ячейкам через ref, чтобы они оставались мемоизированными:
 * пересоздание делегата не должно перерисовывать тысячи строк.
 */
export interface IChatDelegateOptions {
  props: RefObject<ChatViewProps>;
  commands: IChatCommands;
  /** Заморозить нижнюю зону перед показом меню. */
  freezeKeyboard: () => void;
  /** Отпустить зону после закрытия меню. */
  restoreKeyboard: () => void;
}

export const useChatDelegate = ({
  props,
  commands,
  freezeKeyboard,
  restoreKeyboard,
}: IChatDelegateOptions): RefObject<IChatCellDelegate> => {
  const delegate = useMemo<IChatCellDelegate>(
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
        commands.scrollToMessage(replyToId, {
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
    [props, commands, freezeKeyboard, restoreKeyboard],
  );

  const ref = useRef(delegate);

  ref.current = delegate;

  return ref;
};
