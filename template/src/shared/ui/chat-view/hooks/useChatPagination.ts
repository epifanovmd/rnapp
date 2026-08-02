import { useCallback } from "react";

import { IChatViewFeatures } from "../config";
import { IChatScrollController } from "./useChatScroll";

/**
 * Пагинация.
 *
 * У чата два края, и каждый срабатывает только при движении **в его сторону**:
 * иначе инерция после подгрузки сверху тут же вызывает подгрузку снизу.
 */

export interface IChatPaginationOptions {
  scroll: IChatScrollController;
  getFeatures: () => IChatViewFeatures;
  getFlags: () => {
    hasMore: boolean;
    hasNewer: boolean;
    isLoadingTop: boolean;
    isLoadingBottom: boolean;
    hasMessages: boolean;
  };
  onReachTop: (distanceFromTop: number) => void;
  onReachBottom: (distanceFromBottom: number) => void;
}

export const useChatPagination = ({
  scroll,
  getFeatures,
  getFlags,
  onReachTop,
  onReachBottom,
}: IChatPaginationOptions) =>
  useCallback(
    (scrollY: number, contentHeight: number, viewportHeight: number) => {
      const state = scroll.state.current;
      const flags = getFlags();

      if (!flags.hasMessages || state.isInitialScrollProtected) return;

      const features = getFeatures();

      if (
        state.direction !== "down" &&
        scrollY < features.topLoadThreshold &&
        flags.hasMore &&
        !flags.isLoadingTop
      ) {
        onReachTop(scrollY);
      }

      const distanceToBottom = contentHeight - scrollY - viewportHeight;

      if (
        state.direction !== "up" &&
        distanceToBottom < features.bottomLoadThreshold &&
        flags.hasNewer &&
        !flags.isLoadingBottom &&
        !state.isLoadingNewerActive
      ) {
        // Защёлка: пока хост не ответит сменой isLoadingBottom, повторных
        // вызовов быть не должно.
        state.isLoadingNewerActive = true;
        onReachBottom(distanceToBottom);
      }
    },
    [scroll, getFeatures, getFlags, onReachTop, onReachBottom],
  );
