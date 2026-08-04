import { RefObject, useCallback, useMemo, useState } from "react";
import { Dimensions, LayoutChangeEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { IChatFeatures } from "../config";
import { ChatViewProps } from "../types";

export interface IChatPaginationOptions {
  props: RefObject<ChatViewProps>;
  features: IChatFeatures;
  scrollOffset: SharedValue<number>;
}

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
  features,
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

    props.current.onReachTop?.({ distanceFromTop: scrollOffset.value });
  }, [props, scrollOffset]);

  const onEndReached = useCallback(() => {
    const { hasNewer, isLoadingBottom } = props.current;

    if (hasNewer !== true || isLoadingBottom === true) return;

    props.current.onReachBottom?.({ distanceFromBottom: 0 });
  }, [props]);

  return useMemo(() => {
    const asFraction = (px: number) => px / viewportHeight;

    return {
      onLayout,
      onStartReached,
      onEndReached,
      startReachedThreshold: asFraction(features.topLoadThreshold),
      endReachedThreshold: asFraction(features.bottomLoadThreshold),
      scrollToBottomThreshold: asFraction(features.scrollToBottomThreshold),
    };
  }, [
    viewportHeight,
    onLayout,
    onStartReached,
    onEndReached,
    features.topLoadThreshold,
    features.bottomLoadThreshold,
    features.scrollToBottomThreshold,
  ]);
};
