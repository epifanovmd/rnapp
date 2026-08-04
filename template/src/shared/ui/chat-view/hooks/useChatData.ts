import { useMemo, useRef } from "react";

import { IChatFeatures } from "../config";
import { ChatContentRegistry } from "../content";
import {
  buildChatData,
  ChatMessageParser,
  ChatRowsBuilder,
  IChatData,
} from "../data";
import { ChatAction, ChatMessage } from "../types";

export interface IChatDataOptions {
  messages: ChatMessage[];
  /** Реестр типов контента. Фиксируется при первом разборе и дальше неизменен. */
  contentTypes: ChatContentRegistry;
  getActionsForMessage?: (message: ChatMessage) => ChatAction[];
  features: IChatFeatures;
  showBottomLoading: boolean;
  hideFirstSeparator: boolean;
}

/**
 * Входные сообщения → строки списка с сохранением идентичности: не изменившиеся
 * объекты возвращаются те же, поэтому перерисовывается ровно изменившееся.
 * Того же требует и от хоста — он обязан сохранять идентичность `messages`.
 */
export const useChatData = ({
  messages,
  contentTypes,
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
    parser: new ChatMessageParser(contentTypes),
    builder: new ChatRowsBuilder(contentTypes),
  };

  const { parser, builder } = toolsRef.current;

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
