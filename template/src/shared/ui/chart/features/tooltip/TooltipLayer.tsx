import React, { FC, ReactNode, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useChartContext } from "../../core/chart-context";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { findActiveIndex } from "../../core/interaction/nearest-point";
import { useAnimatedSyncedState } from "../../core/interaction/useAnimatedSyncedState";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { ChartLayerComponent } from "../../core/types";
import { TooltipContent } from "./TooltipContent";
import type { ActiveTooltipPoint } from "./types";

export interface TooltipLayerProps {
  visible?: boolean;
  offset?: number;
  colors?: string[];
  backgroundColor?: string;
  textColor?: string;
  renderContent?: (points: ActiveTooltipPoint[]) => ReactNode;
  onVisibilityChange?: (visible: boolean) => void;
}

export const TooltipLayer: ChartLayerComponent<TooltipLayerProps> = ({
  visible = true,
  offset = 12,
  colors = DEFAULT_SERIES_COLORS,
  backgroundColor,
  textColor,
  renderContent,
  onVisibilityChange,
}) => {
  const { series, xScale, dimensions, interaction } = useChartContext();
  const { touchX, touchY, isActive } = interaction;
  const referenceData = series[0]?.data ?? [];

  const activeIndex = useAnimatedSyncedState(
    () => {
      "worklet";

      return findActiveIndex(
        xScale,
        referenceData,
        touchX.value,
        isActive.value,
      );
    },
    [referenceData, xScale, touchX, isActive],
    -1,
  );

  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useAnimatedReaction(
    () => isActive.value,
    (next, previous) => {
      if (next !== previous && onVisibilityChange) {
        scheduleOnRN(onVisibilityChange, next);
      }
    },
    [isActive, onVisibilityChange],
  );

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setContentSize(previous =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const minLeft = dimensions.padding.left;
    const maxLeft = Math.max(
      minLeft,
      dimensions.width - dimensions.padding.right - contentSize.width,
    );
    const minTop = dimensions.padding.top;
    const maxTop = Math.max(
      minTop,
      dimensions.height - dimensions.padding.bottom - contentSize.height,
    );

    const rawLeft = touchX.value - contentSize.width / 2;
    const rawTop = touchY.value - contentSize.height - offset;

    return {
      opacity: isActive.value ? 1 : 0,
      left: Math.min(Math.max(rawLeft, minLeft), maxLeft),
      top: Math.min(Math.max(rawTop, minTop), maxTop),
    };
  });

  if (!visible) {
    return null;
  }

  const points: ActiveTooltipPoint[] =
    activeIndex < 0
      ? []
      : series
          .filter(item => item.data[activeIndex] !== undefined)
          .map((item, index) => ({
            series: item,
            datum: item.data[activeIndex],
            color: resolveSeriesColor(item, index, colors),
          }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <View onLayout={onContentLayout}>
        {renderContent ? (
          renderContent(points)
        ) : (
          <TooltipContent
            points={points}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});

TooltipLayer.layerKind = "overlay";
