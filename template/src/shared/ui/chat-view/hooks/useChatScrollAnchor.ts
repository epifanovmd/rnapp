import { useCallback, useMemo, useRef } from "react";

import { IChatData } from "../data";
import {
  computeScrollAnchor,
  computeVisibleAnchors,
  IChatGeometry,
} from "../scroll";
import { IChatScrollAnchor } from "../types";
import { IChatScrollController } from "./useChatScroll";

/** Троттлинг отправки якоря наружу (мс). */
const ANCHOR_THROTTLE_MS = 300;

/**
 * Якорь скролла: отчёт об изменении якоря во время скролла и по его остановке.
 *
 * Якорь отправляется только при **пользовательском** скролле: во время
 * начальной защиты и программных перемещений позицией управляет хост.
 */

export interface IChatScrollAnchorOptions {
  readGeometry: () => IChatGeometry;
  data: React.RefObject<IChatData>;
  scroll: IChatScrollController;
  getScrollToBottomThreshold: () => number;
  onChange: (anchor: IChatScrollAnchor) => void;
}

export interface IChatScrollAnchorController {
  /** Текущий якорь. */
  current: () => IChatScrollAnchor | null;
  /** Все видимые якоря. */
  visible: () => IChatScrollAnchor[];
  /** Троттленная отправка во время скролла. */
  reportThrottled: () => void;
  /** Немедленная отправка после остановки скролла. */
  reportSettled: () => void;
}

export const useChatScrollAnchor = ({
  readGeometry,
  data,
  scroll,
  getScrollToBottomThreshold,
  onChange,
}: IChatScrollAnchorOptions): IChatScrollAnchorController => {
  const lastReportAtRef = useRef(0);

  const lastMessageId = useCallback(() => {
    const { parsed } = data.current;

    return parsed.length > 0 ? parsed[parsed.length - 1].id : undefined;
  }, [data]);

  const current = useCallback(
    () =>
      computeScrollAnchor(
        readGeometry(),
        data.current.rows,
        lastMessageId(),
        getScrollToBottomThreshold(),
      ),
    [readGeometry, data, lastMessageId, getScrollToBottomThreshold],
  );

  const visible = useCallback(
    () =>
      computeVisibleAnchors(
        readGeometry(),
        data.current.rows,
        lastMessageId(),
        getScrollToBottomThreshold(),
      ),
    [readGeometry, data, lastMessageId, getScrollToBottomThreshold],
  );

  const canReport = useCallback(() => {
    const state = scroll.state.current;

    return !state.isInitialScrollProtected && !state.isProgrammaticScroll;
  }, [scroll]);

  const reportThrottled = useCallback(() => {
    if (!canReport()) return;
    // Только живой скролл пальцем — иначе якорь перебьёт восстановление позиции.
    if (!scroll.state.current.isUserDragging) return;

    const now = Date.now();

    if (now - lastReportAtRef.current < ANCHOR_THROTTLE_MS) return;

    lastReportAtRef.current = now;

    const anchor = current();

    if (anchor) onChange(anchor);
  }, [canReport, scroll, current, onChange]);

  const reportSettled = useCallback(() => {
    if (!canReport()) return;

    // Финальная позиция важнее троттлинга — сбрасываем окно.
    lastReportAtRef.current = 0;

    const anchor = current();

    if (anchor) onChange(anchor);
  }, [canReport, current, onChange]);

  return useMemo(
    () => ({ current, visible, reportThrottled, reportSettled }),
    [current, visible, reportThrottled, reportSettled],
  );
};
