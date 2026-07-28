import React, {
  Children,
  FC,
  isValidElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { LayoutChangeEvent, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ChartCanvas } from "./ChartCanvas";
import { ChartProvider } from "./ChartProvider";
import { useChartInteraction } from "./interaction/useChartInteraction";
import {
  ChartDimensions,
  ChartLayerKind,
  ChartPadding,
  IChartSeries,
} from "./types";

const DEFAULT_PADDING: ChartPadding = {
  top: 16,
  right: 16,
  bottom: 24,
  left: 40,
};
const DEFAULT_HEIGHT = 220;

export interface ChartProps {
  series: IChartSeries[];
  width?: number;
  height?: number;
  padding?: Partial<ChartPadding>;
  xDomain?: [number, number];
  yDomain?: [number, number];
  includeZero?: boolean;
  xPaddingRatio?: number;
  yPaddingRatio?: number;
  xReverse?: boolean;
  yReverse?: boolean;
  interactive?: boolean;
  panActivationDistance?: number;
  onActiveChange?: (active: boolean) => void;
  children?: ReactNode;
}

const layerKindOf = (node: ReactNode): ChartLayerKind => {
  if (!isValidElement(node)) {
    return "skia";
  }

  const kind = (node.type as { layerKind?: ChartLayerKind }).layerKind;

  return kind ?? "skia";
};

export const Chart: FC<ChartProps> = ({
  series,
  width: widthProp,
  height: heightProp,
  padding: paddingProp,
  xDomain,
  yDomain,
  includeZero,
  xPaddingRatio,
  yPaddingRatio,
  xReverse,
  yReverse,
  interactive = true,
  panActivationDistance = 0,
  onActiveChange,
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
  });

  const interactionState = useMemo(
    () => ({
      touchX: interaction.touchX,
      touchY: interaction.touchY,
      isActive: interaction.isActive,
    }),
    [interaction.touchX, interaction.touchY, interaction.isActive],
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

  const childArray = Children.toArray(children);
  const skiaChildren = childArray.filter(
    child => layerKindOf(child) === "skia",
  );
  const overlayChildren = childArray.filter(
    child => layerKindOf(child) === "overlay",
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
          includeZero={includeZero}
          xPaddingRatio={xPaddingRatio}
          yPaddingRatio={yPaddingRatio}
          xReverse={xReverse}
          yReverse={yReverse}
          interaction={interactionState}
        >
          <ChartCanvas
            gesture={interaction.gesture}
            skiaChildren={skiaChildren}
          />
          {overlayChildren}
        </ChartProvider>
      )}
    </View>
  );
};
