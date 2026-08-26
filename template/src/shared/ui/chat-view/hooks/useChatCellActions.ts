import { RefObject, useMemo, useRef } from "react";
import { Keyboard } from "react-native";

import { ChatContentInteraction } from "../content";
import { IChatCellActions } from "../model";
import { ChatViewProps } from "../types";
import { IChatScrollControl } from "./useChatScrollControl";

/**
 * Мост встроенных событий контента к типизированным пропсам чата.
 *
 * Встроенные типы контента продолжают вызывать свои типизированные пропсы.
 * Типам, добавленным приложением, мост не нужен — их события хост получает
 * целиком в `onContentInteraction`.
 */
const bridgeBuiltinInteraction = (
  event: ChatContentInteraction,
  props: ChatViewProps,
): void => {
  const messageId = event.messageId;

  switch (event.type) {
    case "builtin.media.tap":
      Keyboard.dismiss();
      props.onMessagePress?.(messageId, event.payload.index);
      break;

    case "builtin.file.tap":
      Keyboard.dismiss();
      props.onMessagePress?.(messageId);
      break;

    case "builtin.poll.option.tap":
      props.onPollOptionPress?.(
        messageId,
        event.payload.pollId,
        event.payload.optionId,
      );
      break;

    case "builtin.poll.detail.tap":
      props.onPollDetailPress?.(messageId, event.payload.pollId);
      break;
  }
};

export interface IChatCellActionsOptions {
  props: RefObject<ChatViewProps>;
  scrollControl: IChatScrollControl;
  /** Заморозить нижнюю зону перед показом меню. */
  freezeKeyboard: () => void;
  /** Отпустить зону после закрытия меню. */
  restoreKeyboard: () => void;
}

/**
 * Маршрутизация действий ячейки в колбэки хоста.
 *
 * Отдаются ячейкам через ref: пересоздание набора не должно перерисовывать
 * тысячи строк.
 */

export const useChatCellActions = ({
  props,
  scrollControl,
  freezeKeyboard,
  restoreKeyboard,
}: IChatCellActionsOptions): RefObject<IChatCellActions> => {
  const actions = useMemo<IChatCellActions>(
    () => ({
      onTapMessage: messageId => {
        Keyboard.dismiss();
        props.current.onMessagePress?.(messageId);
      },

      onContentInteraction: event => {
        bridgeBuiltinInteraction(event, props.current);
        props.current.onContentInteraction?.(event);
      },

      onEmojiSelect: (emoji, messageId) => {
        restoreKeyboard();
        props.current.onEmojiReactionSelect?.(emoji, messageId);
      },
      onActionSelect: (actionId, messageId) => {
        restoreKeyboard();
        props.current.onActionPress?.(actionId, messageId);
      },

      onReplyTap: replyToId => {
        scrollControl.scrollToMessage(replyToId, {
          position: "center",
          animated: true,
          highlight: true,
        });
        props.current.onReplyMessagePress?.(replyToId);
      },

      onReactionTap: (messageId, emoji) =>
        props.current.onReactionTap?.(emoji, messageId),
      onThreadTap: (messageId, threadId) =>
        props.current.onThreadTap?.(messageId, threadId),
      onLinkTap: (url, messageId) => props.current.onLinkTap?.(url, messageId),
      onPhoneNumberTap: (phoneNumber, messageId) =>
        props.current.onPhoneNumberTap?.(phoneNumber, messageId),
      onContextMenuWillShow: () => freezeKeyboard(),
      onContextMenuDismiss: () => restoreKeyboard(),
    }),
    [props, scrollControl, freezeKeyboard, restoreKeyboard],
  );

  const ref = useRef(actions);

  ref.current = actions;

  return ref;
};
