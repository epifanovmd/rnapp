import React, { FC, useCallback } from "react";

import { ChatContentEmit, ChatContentInteraction } from "../../content";
import { IParsedChatMessage } from "../../data";
import { useChatViewContext } from "../../model";

/**
 * Медиа-часть сообщения; текст рисуется отдельно, ниже.
 *
 * Компонент блока берётся из реестра типов — здесь нет знания о конкретных
 * типах контента.
 */

interface IMessageMediaProps {
  message: IParsedChatMessage;
  /** Доступная ширина внутри пузыря — по ней верстается сетка вложений. */
  innerWidth: number;
}

export const MessageMedia: FC<IMessageMediaProps> = ({
  message,
  innerWidth,
}) => {
  const { contentTypes, actions } = useChatViewContext();

  const messageId = message.id;

  // Пара (type, payload) согласована сигнатурой ChatContentEmit; в объекте
  // события связь между ними уже не выводится, отсюда приведение.
  const emit = useCallback<ChatContentEmit>(
    (type, payload) =>
      actions.current?.onContentInteraction({
        messageId,
        type,
        payload,
      } as ChatContentInteraction),
    [actions, messageId],
  );

  const block = message.body.media;

  if (!block) return null;

  const contentType = contentTypes.get(block.type);

  if (!contentType) {
    if (__DEV__) {
      console.warn(
        `[chat-view] Тип контента "${block.type}" не зарегистрирован.`,
      );
    }

    return null;
  }

  const { Component } = contentType;

  return (
    <Component
      content={block}
      messageId={messageId}
      ownership={message.ownership}
      innerWidth={innerWidth}
      emit={emit}
    />
  );
};
