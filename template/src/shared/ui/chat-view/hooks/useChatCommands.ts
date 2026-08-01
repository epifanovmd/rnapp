import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo, useRef } from "react";

import { ChatCellStore } from "../components/chat-view-context";
import {
  IChatGeometry,
  resolveAnchorOffset,
  resolveBestAnchorOffset,
} from "../model";
import { ChatScrollPosition, IChatScrollAnchor } from "../types";
import { IChatData } from "./useChatData";
import { IChatScrollController } from "./useChatScroll";

/**
 * Скролл к позиции — порт `scrollToBottom` / `scrollToMessage` /
 * `restoreScrollAnchor` / `restoreBestAnchor` / `performHighlight`.
 *
 * Единственное место, которое двигает список. Всё остальное просит его
 * об этом, а не дёргает `listRef` напрямую: иначе флаг
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
      listRef.current?.scrollToIndex({
        index,
        animated,
        viewPosition: viewPositionOf(position),
      });

      if (!highlight) return;

      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => cellStore.highlight(messageId),
        animated ? HIGHLIGHT_DELAY_ANIMATED : HIGHLIGHT_DELAY_INSTANT,
      );
    },
    [data, beginProgrammatic, listRef, cellStore],
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
