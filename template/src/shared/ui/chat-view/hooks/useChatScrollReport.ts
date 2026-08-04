import type { LegendListRef } from "@legendapp/list/react-native";
import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useLatestRef } from "../../../lib/hooks";
import { IChatData } from "../data";
import { readScrollAnchor } from "../model";
import { ChatViewProps, IChatScrollAnchor } from "../types";

const EPSILON = 0.5;
const ANCHOR_SETTLE_MS = 250;

/** Блокировка коллбэков на время начального позиционирования списка. */
const INITIAL_PROTECTION_MS = 1000;

export interface IChatScrollReportOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  props: RefObject<ChatViewProps>;
  scrollOffset: SharedValue<number>;
  isNearEnd: SharedValue<boolean>;
  throttleInterval: number;
  getBottomInset: () => number;
}

export interface IChatScrollReport {
  scheduleAnchorSave: () => void;
  onScrollBeginDrag: () => void;
}

/**
 * Троттленный `onScroll` (UI-поток) и якорь позиции по остановке (JS-дебаунс).
 * Якорь снимается только при пользовательском скролле и после окончания начальной защиты.
 * При размонтировании — финальный снимок.
 */
export const useChatScrollReport = ({
  listRef,
  data,
  props,
  scrollOffset,
  isNearEnd,
  throttleInterval,
  getBottomInset,
}: IChatScrollReportOptions): IChatScrollReport => {
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnchorRef = useRef<IChatScrollAnchor | null>(null);
  const lastReportAt = useSharedValue(0);

  const isUserInteractingRef = useRef(false);

  /** Блокирует якорь на время начального позиционирования. */
  const isInitialScrollProtectedRef = useRef(true);

  useEffect(() => {
    const id = setTimeout(() => {
      isInitialScrollProtectedRef.current = false;
    }, INITIAL_PROTECTION_MS);

    return () => clearTimeout(id);
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current != null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const saveAnchor = useCallback(() => {
    clearSettleTimer();

    if (isInitialScrollProtectedRef.current) return;

    const onScrollAnchorChanged = props.current.onScrollAnchorChanged;

    if (!onScrollAnchorChanged) return;

    const anchor = readScrollAnchor(
      listRef.current,
      data.current.rows,
      isNearEnd.value,
      getBottomInset(),
    );

    if (!anchor) return;

    const last = lastAnchorRef.current;

    if (
      last != null &&
      last.messageId === anchor.messageId &&
      last.wasAtBottom === anchor.wasAtBottom &&
      last.offset === anchor.offset
    ) {
      return;
    }

    lastAnchorRef.current = anchor;
    onScrollAnchorChanged(anchor);
  }, [clearSettleTimer, props, listRef, data, isNearEnd, getBottomInset]);

  // Только unmount — getBottomInset может менять ссылку, cleanup не должен
  // вызывать saveAnchor при перерендерах.
  const saveAnchorRef = useLatestRef(saveAnchor);

  useLayoutEffect(() => () => saveAnchorRef.current(), [saveAnchorRef]);

  const scheduleAnchorSave = useCallback(() => {
    // if (isInitialScrollProtectedRef.current) return;
    if (!isUserInteractingRef.current) return;
    if (!props.current.onScrollAnchorChanged) return;

    clearSettleTimer();
    settleTimerRef.current = setTimeout(() => {
      saveAnchor();
      isUserInteractingRef.current = false;
    }, ANCHOR_SETTLE_MS);
  }, [props, clearSettleTimer, saveAnchor]);

  const onScrollBeginDrag = useCallback(() => {
    isUserInteractingRef.current = true;
  }, []);

  const report = useCallback(
    (y: number, isAtBottom: boolean) => {
      props.current.onScroll?.({ x: 0, y, isAtBottom });
      scheduleAnchorSave();
    },
    [props, scheduleAnchorSave],
  );

  const throttleMs = throttleInterval * 1000;

  useAnimatedReaction(
    () => scrollOffset.value,
    (current, previous) => {
      if (previous === null || Math.abs(current - previous) < EPSILON) return;

      const now = Date.now();

      if (now - lastReportAt.value < throttleMs) return;

      lastReportAt.value = now;
      scheduleOnRN(report, current, isNearEnd.value);
    },
    [throttleMs, report],
  );

  return useMemo(
    () => ({ scheduleAnchorSave, onScrollBeginDrag }),
    [scheduleAnchorSave, onScrollBeginDrag],
  );
};
