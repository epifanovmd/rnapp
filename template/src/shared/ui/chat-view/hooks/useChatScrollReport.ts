import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { IChatData } from "../data";
import { readScrollAnchor } from "../model";
import { ChatViewProps } from "../types";

/** Троттлинг отправки якоря наружу (мс). */
const ANCHOR_THROTTLE_MS = 300;

export interface IChatScrollReportOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  props: RefObject<ChatViewProps>;
  isNearEnd: SharedValue<boolean>;
  /** Троттлинг проброса `onScroll` (сек). */
  throttleInterval: number;
  getBottomInset: () => number;
}

/**
 * Единственное, что осталось в JS-обработчике скролла: троттленный отчёт хосту
 * и снимок якоря позиции. Пагинацией, видимостью и прилипшей датой занимается
 * сам список.
 */
export const useChatScrollReport = ({
  listRef,
  data,
  props,
  isNearEnd,
  throttleInterval,
  getBottomInset,
}: IChatScrollReportOptions) => {
  const lastScrollAtRef = useRef(0);
  const lastAnchorAtRef = useRef(0);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const now = Date.now();
      const isAtBottom = isNearEnd.value;
      const { contentOffset } = event.nativeEvent;

      if (now - lastScrollAtRef.current >= throttleInterval * 1000) {
        lastScrollAtRef.current = now;
        props.current.onScroll?.({
          x: contentOffset.x,
          y: contentOffset.y,
          isAtBottom,
        });
      }

      if (
        props.current.onScrollAnchorChanged &&
        now - lastAnchorAtRef.current >= ANCHOR_THROTTLE_MS
      ) {
        lastAnchorAtRef.current = now;

        const anchor = readScrollAnchor(
          listRef.current,
          data.current.rows,
          isAtBottom,
          getBottomInset(),
        );

        if (anchor) props.current.onScrollAnchorChanged(anchor);
      }
    },
    [listRef, data, props, isNearEnd, throttleInterval, getBottomInset],
  );
};
