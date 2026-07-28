import React, { FC, ReactNode, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
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

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Отступ (px) между точкой привязки и краем тултипа. */
  offset?: number;
  /** Цвета точек-маркеров в дефолтном контенте тултипа (по кругу); переопределяется `series.color`. */
  colors?: string[];
  /** Цвет фона дефолтного контента (игнорируется, если задан `renderContent`). */
  backgroundColor?: string;
  /** Цвет текста дефолтного контента (игнорируется, если задан `renderContent`). */
  textColor?: string;
  /** Привязывать тултип к пиксельной позиции активной точки первой серии, а не к сырой позиции пальца. */
  anchorToPoint?: boolean;
  /** С какой стороны от точки привязки показывать тултип. */
  side?: TooltipSide;
  /** Полностью заменяет дефолтный контент тултипа своим рендером. */
  renderContent?: (points: ActiveTooltipPoint[]) => ReactNode;
  /** Срабатывает при показе/скрытии тултипа (по `isActive`). */
  onVisibilityChange?: (visible: boolean) => void;
}

export const TooltipLayer: ChartLayerComponent<TooltipLayerProps> = ({
  visible = true,
  offset = 12,
  colors = DEFAULT_SERIES_COLORS,
  backgroundColor,
  textColor,
  anchorToPoint = false,
  side = "top",
  renderContent,
  onVisibilityChange,
}) => {
  const { series, xScale, yScale, dimensions, interaction } = useChartContext();
  const { touchX, touchY, isActive } = interaction;
  const referenceData = series[0]?.data ?? [];

  const anchorPoint = useDerivedValue(() => {
    if (!anchorToPoint) {
      return { x: touchX.value, y: touchY.value };
    }

    const index = findActiveIndex(
      xScale,
      referenceData,
      touchX.value,
      isActive.value,
    );

    if (index < 0) {
      return { x: touchX.value, y: touchY.value };
    }

    return {
      x: xScale.toRange(referenceData[index].x),
      y: yScale.toRange(referenceData[index].y),
    };
  }, [anchorToPoint, referenceData, xScale, yScale, touchX, touchY, isActive]);

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

    const anchorX = anchorPoint.value.x;
    const anchorY = anchorPoint.value.y;

    let rawLeft = anchorX - contentSize.width / 2;
    let rawTop = anchorY - contentSize.height / 2;

    if (side === "top") {
      rawTop = anchorY - contentSize.height - offset;
    } else if (side === "bottom") {
      rawTop = anchorY + offset;
    } else if (side === "left") {
      rawLeft = anchorX - contentSize.width - offset;
    } else if (side === "right") {
      rawLeft = anchorX + offset;
    }

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
