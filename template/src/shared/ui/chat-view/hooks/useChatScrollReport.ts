import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { IChatData } from "../data";
import { ChatViewProps, IChatScrollAnchor } from "../types";

/**
 * Единственное, что осталось в JS-обработчике скролла: троттленный отчёт хосту.
 *
 * Позицией, пагинацией, видимостью и прилипшей датой занимается сам список — им
 * этот обработчик не нужен. Здесь только `onScroll` и якорь для сохранения
 * позиции между открытиями чата.
 */

/** Троттлинг отправки якоря наружу (мс). */
const ANCHOR_THROTTLE_MS = 300;

/**
 * Якорь — нижнее видимое сообщение и расстояние от него до низа вьюпорта.
 *
 * Привязка идёт не к индексу (он плывёт при вставках сверху), а к сообщению,
 * поэтому переживает любые изменения выше по списку. Раньше под это был
 * отдельный слой с адаптером геометрии; на деле хватает состояния списка.
 */
const computeAnchor = (
  list: LegendListRef | null,
  rows: IChatData["rows"],
  isAtBottom: boolean,
): IChatScrollAnchor | null => {
  const state = list?.getState();

  if (!state) return null;

  // Внизу чата точную позицию восстанавливать не нужно — достаточно снова
  // прижаться к концу.
  if (isAtBottom) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];

      if (row.type === "message") {
        return { messageId: row.message.id, offset: 0, wasAtBottom: true };
      }
    }

    return null;
  }

  const visibleBottom = state.scroll + state.scrollLength;

  for (let i = state.end; i >= state.start; i--) {
    const row = rows[i];

    if (!row || row.type !== "message") continue;

    const top = state.positionAtIndex(i);
    const size = state.sizeAtIndex(i);

    if (!Number.isFinite(top) || !Number.isFinite(size)) continue;

    return {
      messageId: row.message.id,
      offset: visibleBottom - (top + size),
      wasAtBottom: false,
    };
  }

  return null;
};

export interface IChatScrollReportOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  props: RefObject<ChatViewProps>;
  /** Признак «у нижнего края», который ведёт сам список. */
  isNearEnd: SharedValue<boolean>;
  /** Троттлинг проброса `onScroll` (сек). */
  throttleInterval: number;
}

export const useChatScrollReport = ({
  listRef,
  data,
  props,
  isNearEnd,
  throttleInterval,
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

        const anchor = computeAnchor(
          listRef.current,
          data.current.rows,
          isAtBottom,
        );

        if (anchor) props.current.onScrollAnchorChanged(anchor);
      }
    },
    [listRef, data, props, isNearEnd, throttleInterval],
  );
};
