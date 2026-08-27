import React, { memo, ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

import { getStickyOffset, isPinnedAtEdge } from "../core";
import {
  useListScrollOffset,
  useListSticky,
  useListStickyPinned,
} from "../model";
import type { ListStickyEdge } from "../types";
import { isContainerParked, resolveStickyPlacement } from "./sticky-placement";

export interface IListStickyFrameProps {
  edge: ListStickyEdge;
  position: number;
  size: number;
  scrollLength: number;
  limit: number | undefined;
  itemIndex: number;
  clipped: boolean;
  children: (
    offset: SharedValue<number>,
    pinned: SharedValue<boolean>,
  ) => ReactNode;
}

/** Reanimated-инфраструктура монтируется только для sticky-якоря. */
export const ListStickyFrame = memo<IListStickyFrameProps>(
  ({
    edge,
    position,
    size,
    scrollLength,
    limit,
    itemIndex,
    clipped,
    children,
  }) => {
    const scrollOffset = useListScrollOffset();
    const stickyConfigs = useListSticky();
    const pinnedIndices = useListStickyPinned();
    const { mode, edgeOffset, stickySize, hasOverlay } = resolveStickyPlacement(
      stickyConfigs,
      edge,
      size,
    );

    const offset = useDerivedValue(() => {
      if (isContainerParked(position)) return 0;

      return getStickyOffset({
        edge,
        position,
        size,
        scrollLength,
        scroll: scrollOffset.value,
        edgeOffset: edgeOffset?.value ?? 0,
        limit,
        stickySize,
      });
    }, [edge, position, size, scrollLength, limit, stickySize]);

    const pinnedByOverlay = useDerivedValue(() => {
      if (!hasOverlay || isContainerParked(position)) return false;

      const rendered =
        edge === "start" ? pinnedIndices.start.value : pinnedIndices.end.value;

      if (rendered !== itemIndex) return false;

      return isPinnedAtEdge({
        edge,
        position,
        size,
        scrollLength,
        scroll: scrollOffset.value,
        edgeOffset: edgeOffset?.value ?? 0,
        limit,
        stickySize,
      });
    }, [
      edge,
      hasOverlay,
      itemIndex,
      position,
      size,
      scrollLength,
      limit,
      stickySize,
    ]);

    const animatedStyle = useAnimatedStyle(
      () => ({
        opacity: mode === "container" && pinnedByOverlay.value ? 0 : 1,
        transform: [{ translateY: mode === "container" ? offset.value : 0 }],
      }),
      [mode],
    );
    const style = useMemo(
      () => [
        styles.container,
        { top: position },
        clipped ? { height: size, overflow: "hidden" as const } : null,
        styles.sticky,
      ],
      [position, size, clipped],
    );

    return (
      <Animated.View style={[style, animatedStyle]}>
        {children(offset, pinnedByOverlay)}
      </Animated.View>
    );
  },
);

ListStickyFrame.displayName = "ListStickyFrame";

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  sticky: { zIndex: 1 },
});
