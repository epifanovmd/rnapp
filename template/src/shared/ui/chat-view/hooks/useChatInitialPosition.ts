import type { LegendListRef } from "@legendapp/list/react-native";
import {
  RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

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
  /** Список отрисовал первый кадр и знает реальные высоты строк. */
  onListLoad: () => void;
}

/**
 * Правильность первого кадра: нижняя зона и позиция по якорю.
 *
 * Якорь читается один раз, на монтировании: дальше позицией распоряжается
 * пользователь. Декларативная цель подводит близко по оценочным высотам, а
 * точную посадку делает `onListLoad` — уже по измеренным.
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

  useLayoutEffect(() => {
    listRef.current?.reportContentInset({ bottom: getBottomInset() });
  }, [listRef, getBottomInset]);

  const scrollIndex = useMemo(() => {
    const initial = anchorRef.current;

    if (!initial || initial.wasAtBottom) return undefined;

    const index = data.current.rowIndexOf(initial.messageId);

    if (index == null) return undefined;

    return resolveAnchorScrollIndex(index, initial, contentPaddingTop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onListLoad = useCallback(() => {
    if (didAlignRef.current) return;

    didAlignRef.current = true;

    const initial = anchorRef.current;
    const list = listRef.current;

    if (!initial || initial.wasAtBottom || !list) return;

    const index = data.current.rowIndexOf(initial.messageId);

    if (index == null) return;

    const offset = resolveAnchorScrollOffset(
      list,
      index,
      initial.offset,
      getBottomInset(),
    );

    if (offset == null) return;

    list.scrollToOffset({ offset, animated: false });
  }, [listRef, data, getBottomInset]);

  return useMemo(
    () => ({ scrollIndex, onListLoad }),
    [scrollIndex, onListLoad],
  );
};
