import type { LegendListRef } from "@legendapp/list/react-native";
import {
  RefObject,
  useCallback,
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

import { IChatData } from "../data";
import { readScrollAnchor } from "../model";
import { ChatViewProps, IChatScrollAnchor } from "../types";

const EPSILON = 0.5;
const ANCHOR_SETTLE_MS = 250;

export interface IChatScrollReportOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  props: RefObject<ChatViewProps>;
  /** Позиция скролла — её ведёт сам список, на UI-потоке. */
  scrollOffset: SharedValue<number>;
  isNearEnd: SharedValue<boolean>;
  /** Троттлинг проброса `onScroll` (сек). */
  throttleInterval: number;
  getBottomInset: () => number;
}

export interface IChatScrollReport {
  scheduleAnchorSave: () => void;
}

/**
 * Троттленный `onScroll` (UI-поток) и якорь позиции по остановке (JS-дебаунс).
 * Якорь снимается при любом движении — палец, инерция, программный скролл, —
 * и при размонтировании. Повторы не уходят.
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

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current != null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const saveAnchor = useCallback(() => {
    clearSettleTimer();

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

  const scheduleAnchorSave = useCallback(() => {
    if (!props.current.onScrollAnchorChanged) return;

    clearSettleTimer();
    settleTimerRef.current = setTimeout(saveAnchor, ANCHOR_SETTLE_MS);
  }, [props, clearSettleTimer, saveAnchor]);

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

  useLayoutEffect(() => () => saveAnchor(), [saveAnchor]);

  return useMemo(() => ({ scheduleAnchorSave }), [scheduleAnchorSave]);
};
