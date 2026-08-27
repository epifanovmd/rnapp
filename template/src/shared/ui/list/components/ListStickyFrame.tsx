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

/** Геометрия якоря и его содержимое. */
export interface IListStickyFrameProps {
  edge: ListStickyEdge;
  /** Позиция строки в координатах элементов. */
  position: number;
  size: number;
  scrollLength: number;
  /** Предел смещения: докуда якорь поднимается, не выходя за свою группу. */
  limit: number | undefined;
  itemIndex: number;
  /** Содержимое подрезано по слоту строки. */
  clipped: boolean;
  /**
   * Содержимое ячейки. Смещение и признак «нарисован слоем» приходят сюда
   * shared values: их применяет сама ячейка, без рендера на каждый кадр.
   */
  children: (
    offset: SharedValue<number>,
    pinned: SharedValue<boolean>,
  ) => ReactNode;
}

/**
 * Обёртка ячейки-якоря.
 *
 * Зачем нужна: прилипание — покадровый пересчёт смещения от скролла, и живёт он
 * на UI-потоке. Заводить такой пересчёт на каждую строку списка нельзя, поэтому
 * Reanimated-инфраструктура монтируется только вокруг якорей.
 *
 * Что делает: держит строку на её месте в контенте, а у кромки — сдвигает
 * трансформом. В режиме `container` сдвигается вся строка; в режиме `offset`
 * строка стоит на месте, а смещение уходит в содержимое. Пока якорь у кромки
 * рисует слой поверх списка, копия внутри контента прячется прозрачностью —
 * место для касаний за ней остаётся.
 */
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
