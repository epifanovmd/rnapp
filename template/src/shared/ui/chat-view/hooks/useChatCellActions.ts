import { RefObject, useMemo, useRef } from "react";
import { Keyboard } from "react-native";

import { IChatCellActions } from "../model";
import { ChatViewProps } from "../types";
import { IChatScrollControl } from "./useChatScrollControl";

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
      onTapMessage: (messageId, attachmentIndex) => {
        Keyboard.dismiss();
        props.current.onMessagePress?.(
          attachmentIndex != null
            ? { messageId, attachmentIndex }
            : { messageId },
        );
      },

      onEmojiSelect: (emoji, messageId) => {
        restoreKeyboard();
        props.current.onEmojiReactionSelect?.({ emoji, messageId });
      },
      onActionSelect: (actionId, messageId) => {
        restoreKeyboard();
        props.current.onActionPress?.({ actionId, messageId });
      },

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

      onContextMenuWillShow: () => freezeKeyboard(),
      onContextMenuDismiss: () => restoreKeyboard(),
    }),
    [props, scrollControl, freezeKeyboard, restoreKeyboard],
  );

  const ref = useRef(actions);

  ref.current = actions;

  return ref;
};
