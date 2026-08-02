import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useEffect, useMemo, useRef } from "react";

import { ChatHighlightStore } from "../components/chat-highlight-store";
import { IChatData } from "../data";
import { ChatScrollPosition } from "../types";

/**
 * Команды скролла.
 *
 * Единственное место, которое двигает список. Восстановления позиции по якорям
 * здесь больше нет: её держит сам список — `maintainVisibleContentPosition`
 * при вставках выше вьюпорта и `maintainScrollAtEnd`, когда мы у нижнего края.
 */

/** Пауза перед подсветкой: сообщение должно доехать до места. */
const HIGHLIGHT_DELAY_ANIMATED = 350;
const HIGHLIGHT_DELAY_INSTANT = 100;

export interface IChatScrollToMessageOptions {
  position?: ChatScrollPosition;
  animated?: boolean;
  highlight?: boolean;
}

export interface IChatCommands {
  scrollToBottom: (animated?: boolean) => void;
  scrollToMessage: (
    messageId: string,
    options?: IChatScrollToMessageOptions,
  ) => void;
}

export interface IChatCommandsOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  highlight: ChatHighlightStore;
  /**
   * Перекрытие контента снизу (клавиатура + панель ввода). Нужно
   * `scrollToMessage`, чтобы центрировать сообщение по **видимой** области:
   * при открытой клавиатуре видимый центр выше, и без поправки сообщение
   * уходит под клавиатуру.
   */
  getBottomInset: () => number;
}

const VIEW_POSITIONS: Record<ChatScrollPosition, number> = {
  top: 0,
  center: 0.5,
  bottom: 1,
};

export const useChatCommands = ({
  listRef,
  data,
  highlight,
  getBottomInset,
}: IChatCommandsOptions): IChatCommands => {
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  return useMemo<IChatCommands>(
    () => ({
      scrollToBottom: (animated = true) =>
        listRef.current?.scrollToEnd({ animated }),

      scrollToMessage: (messageId, options = {}) => {
        const {
          position = "center",
          animated = true,
          highlight: shouldHighlight = true,
        } = options;
        const index = data.current.rowIndexById.get(messageId);

        if (index == null) return;

        const viewPosition = VIEW_POSITIONS[position];

        // Список центрирует элемент в полном вьюпорте, но при открытой
        // клавиатуре видимая область короче на нижнее перекрытие.
        // Отрицательный `viewOffset` возвращает элемент в видимый центр.
        listRef.current?.scrollToIndex({
          index,
          animated,
          viewPosition,
          viewOffset: -viewPosition * getBottomInset(),
        });

        if (!shouldHighlight) return;

        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(
          () => highlight.highlight(messageId),
          animated ? HIGHLIGHT_DELAY_ANIMATED : HIGHLIGHT_DELAY_INSTANT,
        );
      },
    }),
    [listRef, data, highlight, getBottomInset],
  );
};
