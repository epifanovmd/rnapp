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
  /**
   * Перекрытие контента снизу (клавиатура + панель ввода): видимая область
   * короче вьюпорта на эту величину, а список о ней не знает — зона живёт
   * распоркой в конце контента.
   */
  getBottomInset: () => number;
  /**
   * Позицию попросили изменить программно. Отправка сообщения, FAB и переход к
   * сообщению приходят сюда — этого достаточно, чтобы снять якорь после любого
   * из них: снимет его всё равно один общий таймер устаканивания.
   */
  onScrollRequested?: () => void;
}

/** Команды прокрутки: `scrollToEnd` без поправок, `scrollToIndex` — с поправкой на зону. */
export const useChatScrollControl = ({
  listRef,
  data,
  highlight,
  getBottomInset,
  onScrollRequested,
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
      scrollToBottom: (animated = true) => {
        onScrollRequested?.();
        listRef.current?.scrollToEnd({ animated });
      },

      scrollToMessage: (messageId, options = {}) => {
        const {
          position = "center",
          animated = true,
          highlight: shouldHighlight = true,
        } = options;
        const index = data.current.rowIndexOf(messageId);

        if (index == null) return;

        const viewPosition = VIEW_POSITIONS[position];

        onScrollRequested?.();

        // Компенсация: список центрирует по полному вьюпорту, а видимая область короче на зону.
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
    [listRef, data, highlight, getBottomInset, onScrollRequested],
  );
};
