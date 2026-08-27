import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { isPinnedAtEdge } from "../core";
import { useListSignal } from "../hooks";
import {
  useListRuntime,
  useListScrollOffset,
  useListStickyPinned,
} from "../model";
import type { IListStickyConfig } from "../types";
import type { IListStickyOverlayProps } from "./ListStickyOverlay";
import { resolveOverlayRenderer } from "./sticky-placement";

interface IListStickyPinProps extends IListStickyOverlayProps {
  config: IListStickyConfig;
}

/**
 * Прилипшая копия одной кромки.
 *
 * Видимость решается на UI-потоке тем же предикатом, что прячет копию внутри
 * контента: обе записи считаются в один проход мапперов и не могут разойтись
 * даже на кадр.
 */
export const ListStickyPin = memo<IListStickyPinProps>(
  ({ config, renderItem, extraData }) => {
    const runtime = useListRuntime();
    const scrollOffset = useListScrollOffset();
    const pinnedIndices = useListStickyPinned();

    const index =
      useListSignal(
        config.edge === "start"
          ? "activeStickyStartIndex"
          : "activeStickyEndIndex",
      ) ?? -1;
    const scrollLength = useListSignal("scrollLength") ?? 0;
    // Раскладка могла поехать под тем же якорем — геометрию нужно перечитать.
    const totalSize = useListSignal("totalSize") ?? 0;

    const geometry = useMemo(
      () => runtime.getStickyGeometry(index),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [runtime, index, totalSize],
    );
    const item = useMemo(
      () => runtime.getItemAt(index),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [runtime, index, totalSize],
    );

    const { edge } = config;
    const edgeOffset = config.offset;
    const stickySize = config.size ?? geometry?.size ?? 0;

    const style = useAnimatedStyle(() => {
      const shift = edgeOffset?.value ?? 0;
      const visible =
        geometry !== undefined &&
        isPinnedAtEdge({
          edge,
          position: geometry.position,
          size: geometry.size,
          scrollLength,
          scroll: scrollOffset.value,
          edgeOffset: shift,
          limit: geometry.limit,
          stickySize,
        });

      return {
        opacity: visible ? 1 : 0,
        transform: [{ translateY: edge === "start" ? shift : -shift }],
      };
    }, [edge, geometry, scrollLength, stickySize]);

    const content = resolveOverlayRenderer(config, renderItem);
    const rendered =
      content !== undefined && geometry !== undefined ? index : -1;

    // После коммита, а не во время: копия внутри контента прячется по этому
    // значению, и до отрисовки слоя прятаться ей нельзя.
    useEffect(() => {
      const target =
        config.edge === "start" ? pinnedIndices.start : pinnedIndices.end;

      target.value = rendered;

      return () => {
        target.value = -1;
      };
    }, [config.edge, pinnedIndices, rendered]);

    if (content === undefined) return null;

    // Узел смонтирован всегда, даже когда прилипшего якоря нет: новый
    // анимированный узел коммитится с базовым стилем, снятым при первом
    // рендере, и на кадр показал бы копию не там, где она нужна.
    return (
      <Animated.View
        style={[edge === "start" ? styles.start : styles.end, style]}
        pointerEvents={"none"}
      >
        {index >= 0 && geometry !== undefined
          ? content({ item, index, type: "", extraData })
          : null}
      </Animated.View>
    );
  },
);

ListStickyPin.displayName = "ListStickyPin";

const styles = StyleSheet.create({
  end: { bottom: 0, left: 0, position: "absolute", right: 0 },
  start: { left: 0, position: "absolute", right: 0, top: 0 },
});
