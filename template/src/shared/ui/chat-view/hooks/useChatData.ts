import { useMemo, useRef } from "react";

import { IChatViewFeatures } from "../config";
import {
  buildChatData,
  ChatMessageParser,
  ChatRowsBuilder,
  IChatData,
  IParsedChatMessage,
} from "../data";
import { ChatAction, ChatMessage } from "../types";

/**
 * React-обёртки над слоем данных: разбор входных сообщений и построение строк.
 *
 * Оба преобразования сохраняют идентичность неизменённых объектов — от этого
 * напрямую зависит стоимость обновления списка (см. `ChatMessageParser` и
 * `ChatRowsBuilder`).
 */

/** Разбор входных сообщений. Отдельно от строк — меняется реже. */
export const useParsedMessages = (
  messages: ChatMessage[],
  getActionsForMessage?: (message: ChatMessage) => ChatAction[],
): IParsedChatMessage[] => {
  const parserRef = useRef<ChatMessageParser | null>(null);

  parserRef.current ??= new ChatMessageParser();

  const parser = parserRef.current;

  return useMemo(
    () => parser.parse(messages, getActionsForMessage),
    [parser, messages, getActionsForMessage],
  );
};

export interface IChatDataOptions {
  features: IChatViewFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

/**
 * Строки и индексы для отображаемых сообщений. Отображаемые отстают от входных
 * на время эффекта распада, поэтому вход здесь — именно они.
 */
export const useChatData = (
  displayed: IParsedChatMessage[],
  { features, showBottomLoading, hideFirstSeparator }: IChatDataOptions,
): IChatData => {
  const builderRef = useRef<ChatRowsBuilder | null>(null);

  builderRef.current ??= new ChatRowsBuilder();

  const builder = builderRef.current;

  return useMemo(
    () =>
      buildChatData(builder, displayed, {
        features,
        showBottomLoading,
        hideFirstSeparator,
      }),
    [builder, displayed, features, showBottomLoading, hideFirstSeparator],
  );
};
