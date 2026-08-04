import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo, useRef } from "react";

import { useLatestRef } from "../../../lib/hooks";
import { IChatData } from "../data";
import {
  IAnchorScrollIndex,
  resolveAnchorScrollIndex,
  resolveAnchorScrollOffset,
} from "../model";
import { IChatScrollAnchor } from "../types";

export interface IChatInitialPositionOptions {
  anchor: IChatScrollAnchor | undefined;
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  contentPaddingTop: number;
  getBottomInset: () => number;
}

export interface IChatInitialPosition {
  /** Начальная цель списка; `undefined` — открываемся в конце. */
  scrollIndex: IAnchorScrollIndex | undefined;
  /** Список отрисовал первый кадр и знает реальные высоты видимых строк. */
  onListLoad: () => void;
}

/**
 * Начальная позиция списка: декларативный `initialScrollIndex` +
 * доводка по измеренным высотам после первого кадра.
 */
export const useChatInitialPosition = ({
  anchor,
  listRef,
  data,
  contentPaddingTop,
  getBottomInset,
}: IChatInitialPositionOptions): IChatInitialPosition => {
  const anchorRef = useRef(anchor);
  const didAlignRef = useRef(false);

  const scrollIndex = useMemo(() => {
    const initial = anchorRef.current;

    if (!initial || initial.wasAtBottom) return undefined;

    const index = data.current.rowIndexOf(initial.messageId);

    if (index == null) return undefined;

    return resolveAnchorScrollIndex(
      index,
      initial,
      contentPaddingTop,
      getBottomInset(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alignRef = useLatestRef(() => {
    if (didAlignRef.current) return;

    const initial = anchorRef.current;

    if (!initial || initial.wasAtBottom) {
      didAlignRef.current = true;

      return;
    }

    const list = listRef.current;

    if (!list) return;

    const index = data.current.rowIndexOf(initial.messageId);

    if (index == null) {
      didAlignRef.current = true;

      return;
    }

    const offset = resolveAnchorScrollOffset(
      list,
      index,
      initial.offset,
      getBottomInset(),
    );

    // Строка не измерена — скроллим к ней по оценке, чтобы попала в окно рендера.
    if (offset == null) {
      const bottomInset = getBottomInset();

      list.scrollToIndex({
        ...resolveAnchorScrollIndex(
          index,
          initial,
          contentPaddingTop,
          bottomInset,
        ),
        animated: false,
      });
      requestAnimationFrame(() => alignRef.current());

      return;
    }

    didAlignRef.current = true;
    list.scrollToOffset({ offset, animated: false });
  });

  const onListLoad = useCallback(() => alignRef.current(), [alignRef]);

  return useMemo(
    () => ({ scrollIndex, onListLoad }),
    [scrollIndex, onListLoad],
  );
};
