import React, { FC, useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ChartCanvas } from "./ChartCanvas";
import { ChartProvider } from "./ChartProvider";
import { useChartInteraction } from "./interaction/useChartInteraction";
import { ChartDimensions, ChartPadding, ChartProps } from "./types";

const DEFAULT_PADDING: ChartPadding = {
  top: 36,
  right: 16,
  bottom: 36,
  left: 16,
};
const DEFAULT_HEIGHT = 220;

// Вынесены из дефолтов параметров — новый массив на каждый рендер сломал бы мемоизацию usePanGesture.
const DEFAULT_PAN_ACTIVE_OFFSET_X: [number, number] = [-8, 8];
const DEFAULT_PAN_FAIL_OFFSET_Y: [number, number] = [-8, 8];

/** Главный компонент графика. Управляет layout, жестами и рендерингом слоёв через Sketch + Reanimated. */
export const Chart: FC<ChartProps> = ({
  series,
  width: widthProp,
  height: heightProp,
  padding: paddingProp,
  xDomain,
  yDomain,
  beginAtZero,
  xPaddingRatio,
  yPaddingRatio,
  xReverse,
  yReverse,
  interactive = true,
  panActivationDistance = 0,
  panActiveOffsetX = DEFAULT_PAN_ACTIVE_OFFSET_X,
  panFailOffsetY = DEFAULT_PAN_FAIL_OFFSET_Y,
  twoFingerEnabled = true,
  onActiveChange,
  onChange,
  children,
}) => {
  const [measuredWidth, setMeasuredWidth] = useState(widthProp ?? 0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setMeasuredWidth(previous =>
      previous === nextWidth ? previous : nextWidth,
    );
  }, []);

  const width = widthProp ?? measuredWidth;
  const height = heightProp ?? DEFAULT_HEIGHT;

  const padding = useMemo<ChartPadding>(
    () => ({ ...DEFAULT_PADDING, ...paddingProp }),
    [paddingProp],
  );

  const dimensions = useMemo<ChartDimensions>(
    () => ({
      width,
      height,
      padding,
      plotWidth: Math.max(width - padding.left - padding.right, 0),
      plotHeight: Math.max(height - padding.top - padding.bottom, 0),
    }),
    [width, height, padding],
  );

  const interaction = useChartInteraction(dimensions, {
    enabled: interactive,
    minDistance: panActivationDistance,
    activeOffsetX: panActiveOffsetX,
    failOffsetY: panFailOffsetY,
    twoFingerEnabled,
  });

  const baseInteractionState = useMemo(
    () => ({
      touchX: interaction.touchX,
      touchY: interaction.touchY,
      isActive: interaction.isActive,
      touchX2: interaction.touchX2,
      touchY2: interaction.touchY2,
      isSecondActive: interaction.isSecondActive,
    }),
    [
      interaction.touchX,
      interaction.touchY,
      interaction.isActive,
      interaction.touchX2,
      interaction.touchY2,
      interaction.isSecondActive,
    ],
  );

  useAnimatedReaction(
    () => interaction.isActive.value,
    (next, previous) => {
      if (next !== previous && onActiveChange) {
        scheduleOnRN(onActiveChange, next);
      }
    },
    [interaction.isActive, onActiveChange],
  );

  const ready = dimensions.width > 0 && dimensions.height > 0;

  return (
    <View style={{ width: widthProp, height }} onLayout={onLayout}>
      {ready && (
        <ChartProvider
          series={series}
          dimensions={dimensions}
          xDomain={xDomain}
          yDomain={yDomain}
          beginAtZero={beginAtZero}
          xPaddingRatio={xPaddingRatio}
          yPaddingRatio={yPaddingRatio}
          xReverse={xReverse}
          yReverse={yReverse}
          interaction={baseInteractionState}
          onChange={onChange}
        >
          <ChartCanvas gesture={interaction.gesture}>{children}</ChartCanvas>
        </ChartProvider>
      )}
    </View>
  );
};
