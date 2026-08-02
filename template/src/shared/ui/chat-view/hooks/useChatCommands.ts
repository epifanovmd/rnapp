import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo, useRef } from "react";

import { ChatCellStore } from "../components/chat-view-context";
import { IChatData } from "../data";
import {
  IChatGeometry,
  resolveAnchorOffset,
  resolveBestAnchorOffset,
} from "../scroll";
import { ChatScrollPosition, IChatScrollAnchor } from "../types";
import { IChatScrollController } from "./useChatScroll";

/**
 * Команды скролла — порт `scrollToBottom` / `scrollToMessage` /
 * `restoreScrollAnchor` / `restoreBestAnchor` / `performHighlight`.
 *
 * Единственное место, которое двигает список: иначе флаг
 * `isProgrammaticScroll` рассинхронизируется и якорь начнёт улетать.
 */

/** Задержка подсветки после скролла. Порт значений 0.35 / 0.1 с. */
const HIGHLIGHT_DELAY_ANIMATED = 350;
const HIGHLIGHT_DELAY_INSTANT = 100;

export interface IChatCommandsOptions {
  listRef: RefObject<LegendListRef | null>;
  readGeometry: () => IChatGeometry;
  data: RefObject<IChatData>;
  scroll: IChatScrollController;
  cellStore: ChatCellStore;
  /**
   * Перекрытие контента снизу (клавиатура + панель + отступы) числом, из JS.
   * Нужно `scrollToMessage`, чтобы центрировать сообщение по **видимой**
   * области, а не по всему вьюпорту: при открытой клавиатуре видимый центр
   * выше, и без поправки сообщение уходит под клавиатуру.
   */
  getBottomInset: () => number;
}

export interface IChatCommands {
  scrollToBottom: (animated?: boolean) => void;
  scrollToMessage: (
    messageId: string,
    options?: {
      position?: ChatScrollPosition;
      animated?: boolean;
      highlight?: boolean;
    },
  ) => void;
  /** Восстановить позицию по якорю. Порт `restoreScrollAnchor`. */
  restoreAnchor: (anchor: IChatScrollAnchor, animated?: boolean) => boolean;
  /** Восстановить по лучшему из якорей. Порт `restoreBestAnchor`. */
  restoreBestAnchor: (anchors: IChatScrollAnchor[]) => boolean;
}

/** Порт маппинга строкового `position` на `UICollectionView.ScrollPosition`. */
const viewPositionOf = (position: ChatScrollPosition): number => {
  switch (position) {
    case "top":
      return 0;
    case "bottom":
      return 1;
    default:
      return 0.5;
  }
};

export const useChatCommands = ({
  listRef,
  readGeometry,
  data,
  scroll,
  cellStore,
  getBottomInset,
}: IChatCommandsOptions): IChatCommands => {
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Пометить скролл программным, чтобы якорь не отправился по дороге. */
  const beginProgrammatic = useCallback(
    (animated: boolean) => {
      scroll.state.current.isProgrammaticScroll = true;

      // Без анимации флаг снимаем сразу: `onMomentumScrollEnd` не придёт.
      if (!animated) {
        scroll.state.current.isProgrammaticScroll = false;
      }
    },
    [scroll],
  );

  const scrollToBottom = useCallback(
    (animated = true) => {
      const state = scroll.state.current;

      if (data.current.parsed.length === 0) {
        // Данных ещё нет — запомним намерение, применит `useChatMessageUpdates`.
        state.pendingScrollToBottom = true;

        return;
      }

      state.pendingScrollToBottom = false;
      beginProgrammatic(animated);
      listRef.current?.scrollToEnd({ animated });
    },
    [scroll, data, beginProgrammatic, listRef],
  );

  const scrollToMessage = useCallback<IChatCommands["scrollToMessage"]>(
    (messageId, options = {}) => {
      const {
        position = "center",
        animated = true,
        highlight = true,
      } = options;
      const index = data.current.rowIndexById.get(messageId);

      if (index == null) return;

      beginProgrammatic(animated);

      const viewPosition = viewPositionOf(position);

      // Порт центрирования по видимой области: LegendList центрирует элемент
      // в полном вьюпорте, но при открытой клавиатуре видимая область короче
      // на нижнее перекрытие. Отрицательный `viewOffset` добавляет к смещению
      // `viewPosition * bottomInset` — ровно столько, чтобы видимый центр
      // совпал с центром области над клавиатурой (вывод в
      // calculateOffsetWithOffsetPosition: offset -= viewOffset, и центрирование
      // идёт по viewport - trailingInset).
      listRef.current?.scrollToIndex({
        index,
        animated,
        viewPosition,
        viewOffset: -viewPosition * getBottomInset(),
      });

      if (!highlight) return;

      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => cellStore.highlight(messageId),
        animated ? HIGHLIGHT_DELAY_ANIMATED : HIGHLIGHT_DELAY_INSTANT,
      );
    },
    [data, beginProgrammatic, listRef, cellStore, getBottomInset],
  );

  const scrollToOffset = useCallback(
    (offset: number, animated: boolean) => {
      beginProgrammatic(animated);
      listRef.current?.scrollToOffset({ offset, animated });
    },
    [beginProgrammatic, listRef],
  );

  const restoreAnchor = useCallback<IChatCommands["restoreAnchor"]>(
    (anchor, animated = false) => {
      if (anchor.wasAtBottom) {
        scrollToBottom(animated);

        return true;
      }

      const offset = resolveAnchorOffset(
        readGeometry(),
        anchor,
        data.current.rowIndexById,
      );

      if (offset == null) return false;

      scrollToOffset(offset, animated);

      return true;
    },
    [scrollToBottom, readGeometry, data, scrollToOffset],
  );

  const restoreBest = useCallback<IChatCommands["restoreBestAnchor"]>(
    anchors => {
      if (anchors.length === 0) return false;

      if (anchors.some(anchor => anchor.wasAtBottom)) {
        scrollToBottom(false);

        return true;
      }

      const geometry = readGeometry();
      const offset = resolveBestAnchorOffset(
        geometry,
        anchors,
        data.current.rowIndexById,
        geometry.scrollY,
      );

      if (offset == null) return false;

      scrollToOffset(offset, false);

      return true;
    },
    [scrollToBottom, readGeometry, data, scrollToOffset],
  );

  return useMemo(
    () => ({
      scrollToBottom,
      scrollToMessage,
      restoreAnchor,
      restoreBestAnchor: restoreBest,
    }),
    [scrollToBottom, scrollToMessage, restoreAnchor, restoreBest],
  );
};
