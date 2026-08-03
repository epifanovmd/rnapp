import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useEffect, useMemo, useRef } from "react";

import { IChatData } from "../data";
import { ChatHighlightStore } from "../model";
import { ChatScrollPosition } from "../types";

/** Пауза перед подсветкой: сообщение должно доехать до места. */
const HIGHLIGHT_DELAY_ANIMATED = 350;
const HIGHLIGHT_DELAY_INSTANT = 100;

const VIEW_POSITIONS: Record<ChatScrollPosition, number> = {
  top: 0,
  center: 0.5,
  bottom: 1,
};

export interface IChatScrollToMessageOptions {
  position?: ChatScrollPosition;
  animated?: boolean;
  highlight?: boolean;
}

export interface IChatScrollControl {
  scrollToBottom: (animated?: boolean) => void;
  scrollToMessage: (
    messageId: string,
    options?: IChatScrollToMessageOptions,
  ) => void;
}

export interface IChatScrollControlOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  highlight: ChatHighlightStore;
}

/**
 * Команды прокрутки для хоста и ячеек.
 *
 * Поправок на нижнее перекрытие здесь нет: зона приходит списку инсетом, и он
 * вычитает её из вьюпорта сам. Восстановление начальной позиции живёт отдельно
 * — в `useChatInitialPosition`.
 */
export const useChatScrollControl = ({
  listRef,
  data,
  highlight,
}: IChatScrollControlOptions): IChatScrollControl => {
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  return useMemo<IChatScrollControl>(
    () => ({
      scrollToBottom: (animated = true) =>
        listRef.current?.scrollToEnd({ animated }),

      scrollToMessage: (messageId, options = {}) => {
        const {
          position = "center",
          animated = true,
          highlight: shouldHighlight = true,
        } = options;
        const index = data.current.rowIndexOf(messageId);

        if (index == null) return;

        listRef.current?.scrollToIndex({
          index,
          animated,
          viewPosition: VIEW_POSITIONS[position],
        });

        if (!shouldHighlight) return;

        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(
          () => highlight.highlight(messageId),
          animated ? HIGHLIGHT_DELAY_ANIMATED : HIGHLIGHT_DELAY_INSTANT,
        );
      },
    }),
    [listRef, data, highlight],
  );
};
