import {
  IChatMessage,
  messageEditableText,
  messagePreview,
} from "@entities/message";
import {
  IInputBarRef,
  InputBarInputAction,
  InputBarInputActionType,
} from "@shared/ui/input-bar";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";

/**
 * Состояние панели ввода: ответ, правка и отправка.
 *
 * Держит одно текущее действие и переводит вызовы панели в доменные:
 * `onSendMessage` и `onEditMessage` адресуют сообщение id, а не порядком полей.
 */

export interface IChatComposerOptions {
  onSendMessage: (text: string, replyToId?: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
}

export interface IChatComposer {
  /** Текущее действие панели: ответ, правка или ничего. */
  inputAction: InputBarInputAction | null;
  inputBarRef: RefObject<IInputBarRef | null>;
  /** Ответить на сообщение. */
  reply: (message: IChatMessage) => void;
  /** Начать правку сообщения. */
  edit: (message: IChatMessage) => void;
  /** Отменить действие панели. */
  cancel: (type?: InputBarInputActionType) => void;
  /** Отправка из панели. */
  handleSend: (text: string, replyToId?: string) => void;
  /** Подтверждение правки из панели. */
  handleEdit: (text: string, messageId: string) => void;
}

export const useChatComposer = ({
  onSendMessage,
  onEditMessage,
}: IChatComposerOptions): IChatComposer => {
  const inputBarRef = useRef<IInputBarRef | null>(null);
  const [inputAction, setInputAction] = useState<InputBarInputAction | null>(
    null,
  );

  const reply = useCallback((message: IChatMessage) => {
    setInputAction({
      type: "reply",
      messageId: message.id,
      senderName: message.authorName,
      text: messagePreview(message),
      hasImage: message.content.kind === "image",
    });
    inputBarRef.current?.focus();
  }, []);

  const edit = useCallback((message: IChatMessage) => {
    setInputAction({
      type: "edit",
      messageId: message.id,
      text: messageEditableText(message),
    });
    inputBarRef.current?.focus();
  }, []);

  const cancel = useCallback(() => setInputAction(null), []);

  const handleSend = useCallback(
    (text: string, replyToId?: string) => {
      onSendMessage(text, replyToId);
      setInputAction(null);
    },
    [onSendMessage],
  );

  const handleEdit = useCallback(
    (text: string, messageId: string) => {
      onEditMessage(messageId, text);
      setInputAction(null);
    },
    [onEditMessage],
  );

  return useMemo(
    () => ({
      inputAction,
      inputBarRef,
      reply,
      edit,
      cancel,
      handleSend,
      handleEdit,
    }),
    [inputAction, reply, edit, cancel, handleSend, handleEdit],
  );
};
