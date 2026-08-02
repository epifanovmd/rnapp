import { useCallback, useMemo, useRef } from "react";

import { IChatGeometry, isNearBottom } from "../scroll";

export type ChatScrollDirection = "up" | "down" | "none";

/**
 * Состояние скролла — порт полей `scrollDirection` / `isUserDragging` /
 * `isProgrammaticScroll` / `isInitialScrollProtected` из `ChatViewController`
 * и обработчиков `scrollViewWillBeginDragging` / `DidEndDragging` /
 * `DidEndDecelerating`.
 *
 * Всё живёт в ref: скролл не должен вызывать ре-рендер чата.
 */
export interface IChatScrollState {
  /** Направление последнего движения. Порт `scrollDirection`. */
  direction: ChatScrollDirection;
  /** Палец на экране. Порт `isUserDragging`. */
  isUserDragging: boolean;
  /** Идёт программный скролл. Порт `isProgrammaticScroll`. */
  isProgrammaticScroll: boolean;
  /**
   * Начальная защита: до первой раскладки чат не считается «пользовательски
   * проскролленным» и не шлёт ни пагинацию, ни якорь. Порт
   * `isInitialScrollProtected`.
   */
  isInitialScrollProtected: boolean;
  /** Запрошен скролл вниз после отправки. Порт `pendingScrollToBottom`. */
  pendingScrollToBottom: boolean;
  /** Нижняя пагинация уже вызвана. Порт `isLoadingNewerActive`. */
  isLoadingNewerActive: boolean;
}

export interface IChatScrollController {
  state: React.RefObject<IChatScrollState>;
  /** Обновить направление по новой позиции. Порт начала `scrollViewDidScroll`. */
  trackDirection: (y: number) => void;
  /** Внизу ли чат сейчас. Порт `isNearBottom()`. */
  isNearBottom: () => boolean;
  onBeginDrag: () => void;
  onEndDrag: () => void;
  onMomentumEnd: () => void;
}

export interface IChatScrollOptions {
  readGeometry: () => IChatGeometry;
  getScrollToBottomThreshold: () => number;
  /** Скролл устоялся — самое время отправить финальный якорь. */
  onSettled: () => void;
}

export const useChatScroll = ({
  readGeometry,
  getScrollToBottomThreshold,
  onSettled,
}: IChatScrollOptions): IChatScrollController => {
  const state = useRef<IChatScrollState>({
    direction: "none",
    isUserDragging: false,
    isProgrammaticScroll: false,
    isInitialScrollProtected: true,
    pendingScrollToBottom: false,
    isLoadingNewerActive: false,
  });

  const lastYRef = useRef(0);

  const trackDirection = useCallback((y: number) => {
    const previous = lastYRef.current;

    // Порог в 1px гасит дрожание на границе кадра.
    if (y > previous + 1) {
      state.current.direction = "down";
    } else if (y < previous - 1) {
      state.current.direction = "up";
    }

    lastYRef.current = y;
  }, []);

  const nearBottom = useCallback(
    () => isNearBottom(readGeometry(), getScrollToBottomThreshold()),
    [readGeometry, getScrollToBottomThreshold],
  );

  const onBeginDrag = useCallback(() => {
    state.current.isUserDragging = true;
    // Пользователь перехватил управление — отложенный автоскролл отменяется.
    state.current.pendingScrollToBottom = false;
  }, []);

  const onEndDrag = useCallback(() => {
    state.current.isUserDragging = false;
    onSettled();
  }, [onSettled]);

  const onMomentumEnd = useCallback(() => {
    state.current.isProgrammaticScroll = false;
    onSettled();
  }, [onSettled]);

  return useMemo(
    () => ({
      state,
      trackDirection,
      isNearBottom: nearBottom,
      onBeginDrag,
      onEndDrag,
      onMomentumEnd,
    }),
    [trackDirection, nearBottom, onBeginDrag, onEndDrag, onMomentumEnd],
  );
};
