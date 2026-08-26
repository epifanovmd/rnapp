import { RefObject, useCallback, useMemo, useState } from "react";
import { Dimensions, LayoutChangeEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { ChatViewProps } from "../types";

export interface IChatPaginationOptions {
  props: RefObject<ChatViewProps>;
  scrollOffset: SharedValue<number>;
}

/** Пороги подгрузки и «рядом с низом» в пикселях. */
const TOP_LOAD_THRESHOLD = 400;
const BOTTOM_LOAD_THRESHOLD = 400;
const NEAR_BOTTOM_THRESHOLD = 150;

export interface IChatPagination {
  onLayout: (event: LayoutChangeEvent) => void;
  onStartReached: () => void;
  onEndReached: () => void;
  startReachedThreshold: number;
  endReachedThreshold: number;
  scrollToBottomThreshold: number;
}

/**
 * Пагинация и пороги списка.
 *
 * Пороги задаются в пикселях, а список принимает их долей высоты вьюпорта.
 * До первого замера используется высота окна.
 */
export const useChatPagination = ({
  props,
  scrollOffset,
}: IChatPaginationOptions): IChatPagination => {
  const [viewportHeight, setViewportHeight] = useState(
    () => Dimensions.get("window").height,
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) =>
      setViewportHeight(event.nativeEvent.layout.height),
    [],
  );

  const onStartReached = useCallback(() => {
    const { hasMore, isLoadingTop } = props.current;

    if (hasMore !== true || isLoadingTop === true) return;

    props.current.onReachTop?.();
  }, [props]);

  const onEndReached = useCallback(() => {
    const { hasNewer, isLoadingBottom } = props.current;

    if (hasNewer !== true || isLoadingBottom === true) return;

    props.current.onReachBottom?.();
  }, [props]);

  return useMemo(() => {
    const asFraction = (px: number) => px / viewportHeight;

    return {
      onLayout,
      onStartReached,
      onEndReached,
      startReachedThreshold: asFraction(TOP_LOAD_THRESHOLD),
      endReachedThreshold: asFraction(BOTTOM_LOAD_THRESHOLD),
      scrollToBottomThreshold: asFraction(NEAR_BOTTOM_THRESHOLD),
    };
  }, [viewportHeight, onLayout, onStartReached, onEndReached]);
};
