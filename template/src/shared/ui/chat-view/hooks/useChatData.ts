import { useMemo, useRef } from "react";

import { IChatFeatures } from "../config";
import {
  buildChatData,
  ChatMessageParser,
  ChatRowsBuilder,
  IChatData,
} from "../data";
import { ChatAction, ChatMessage } from "../types";

/**
 * Входные сообщения → строки списка.
 *
 * Оба преобразования сохраняют идентичность неизменённых объектов, и от этого
 * напрямую зависит стоимость обновления списка: разобранное сообщение
 * переиспользуется, пока не изменилось входное (сравнение по ссылке), а строка —
 * пока не изменились сообщение, оригинал его цитаты и настройки. Поменялось одно
 * сообщение — перерисовалась одна ячейка.
 *
 * Отсюда требование к хосту: он тоже обязан сохранять идентичность неизменённых
 * элементов `messages`.
 */
export interface IChatDataOptions {
  messages: ChatMessage[];
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];
  features: IChatFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

export const useChatData = ({
  messages,
  getActionsForMessage,
  features,
  showBottomLoading,
  hideFirstSeparator,
}: IChatDataOptions): IChatData => {
  const toolsRef = useRef<{
    parser: ChatMessageParser;
    builder: ChatRowsBuilder;
  } | null>(null);

  toolsRef.current ??= {
    parser: new ChatMessageParser(),
    builder: new ChatRowsBuilder(),
  };

  const { parser, builder } = toolsRef.current;

  // Разбор отдельным мемо: он зависит только от входных сообщений и меняется
  // реже, чем настройки показа.
  const parsed = useMemo(
    () => parser.parse(messages, getActionsForMessage),
    [parser, messages, getActionsForMessage],
  );

  return useMemo(
    () =>
      buildChatData(builder, parsed, {
        features,
        showBottomLoading,
        hideFirstSeparator,
      }),
    [builder, parsed, features, showBottomLoading, hideFirstSeparator],
  );
};
