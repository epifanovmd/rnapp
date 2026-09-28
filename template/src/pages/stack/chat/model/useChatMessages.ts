import { IChatMessage } from "@entities/message";
import { useCallback, useMemo, useRef, useState } from "react";

import { createMockMessages } from "./chat-mock";

/**
 * Сообщения экрана и действия над ними.
 *
 * Живут в памяти: это место источника данных — здесь встанут запросы и сокет,
 * а `ChatView` о подмене не узнает, он видит только массив и три колбэка.
 */

export interface IChatMessages {
  messages: IChatMessage[];
  sendMessage: (text: string, replyToId?: string) => void;
  editMessage: (messageId: string, text: string) => void;
  deleteMessage: (messageId: string) => void;
}

export const useChatMessages = (): IChatMessages => {
  const [messages, setMessages] = useState<IChatMessage[]>(() =>
    createMockMessages(),
  );

  /** Счётчик своих сообщений: ключ строки обязан быть уникальным. */
  const nextId = useRef(0);

  const sendMessage = useCallback((text: string, replyToId?: string) => {
    nextId.current += 1;

    setMessages(current => [
      ...current,
      {
        id: `own:${nextId.current}`,
        content: { kind: "text", text },
        authorId: "me",
        authorName: "Я",
        isOwn: true,
        createdAt: Date.now(),
        replyToId,
      },
    ]);
  }, []);

  const editMessage = useCallback((messageId: string, text: string) => {
    setMessages(current =>
      current.map(message =>
        message.id === messageId && message.content.kind === "text"
          ? { ...message, content: { kind: "text", text }, isEdited: true }
          : message,
      ),
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(current => current.filter(message => message.id !== messageId));
  }, []);

  return useMemo(
    () => ({ messages, sendMessage, editMessage, deleteMessage }),
    [messages, sendMessage, editMessage, deleteMessage],
  );
};
