import React, { FC, useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import {
  useCompetingGestures,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ChartCanvas } from "./ChartCanvas";
import { ChartProvider } from "./ChartProvider";
import { useChartInteraction } from "./interaction/useChartInteraction";
import { useViewportGestures } from "./interaction/useViewportGestures";
import {
  ChartDimensions,
  ChartPadding,
  ChartProps,
  ChartZoomOptions,
} from "./types";
import { resolvePlotRect } from "./utils/plot-rect";
import { useChartViewport } from "./viewport/useChartViewport";

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

const DEFAULT_ZOOM: Required<ChartZoomOptions> = {
  pan: true,
  pinch: true,
  doubleTap: true,
  doubleTapFactor: 2,
  inertia: true,
  inspectDelay: 250,
};

/**
 * Главный компонент графика: layout, жесты, окно просмотра и слои на Skia +
 * Reanimated. С `zoom` — прокрутка, зум двумя пальцами и двойной тап, а
 * перекрестие — по долгому нажатию.
 */
export const Chart: FC<ChartProps> = ({
  series,
  width: widthProp,
  height: heightProp,
  padding: paddingProp,
  xDomain,
  yDomain,
  beginAtZero,
  yNice,
  animateYDomain,
  viewport: viewportProp,
  zoom: zoomProp = false,
  xPaddingRatio,
  yPaddingRatio,
  xReverse,
  yReverse,
  interactive = true,
  panActivationDistance = 0,
  panActiveOffsetX = DEFAULT_PAN_ACTIVE_OFFSET_X,
  panFailOffsetY = DEFAULT_PAN_FAIL_OFFSET_Y,
  twoFingerEnabled = false,
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

  const zoom = useMemo<Required<ChartZoomOptions>>(
    () =>
      zoomProp === false
        ? { ...DEFAULT_ZOOM, pan: false, pinch: false, doubleTap: false }
        : { ...DEFAULT_ZOOM, ...(zoomProp === true ? {} : zoomProp) },
    [zoomProp],
  );
  const zoomEnabled = interactive && zoomProp !== false;

  const internalViewport = useChartViewport();
  const viewport = viewportProp ?? internalViewport;

  const plot = useMemo(() => resolvePlotRect(dimensions), [dimensions]);

  const interaction = useChartInteraction(dimensions, {
    enabled: interactive,
    minDistance: panActivationDistance,
    activeOffsetX: panActiveOffsetX,
    failOffsetY: panFailOffsetY,
    twoFingerEnabled,
    activateAfterLongPress: zoomEnabled ? zoom.inspectDelay : 0,
  });

  const navigation = useViewportGestures(viewport, {
    enabled: zoomEnabled,
    zoom,
    plot,
    xReverse: xReverse ?? false,
    activeOffsetX: panActiveOffsetX,
    failOffsetY: panFailOffsetY,
  });

  const viewportGestures = useSimultaneousGestures(
    navigation.pan,
    navigation.pinch,
  );
  const gesture = useCompetingGestures(
    interaction.gesture,
    viewportGestures,
    navigation.doubleTap,
  );

  const { interacting } = viewport;
  const { settle } = viewport.worklets;
  const { panActive, pinchActive } = navigation;
  const inspecting = interaction.isActive;

  // С зумом, пока идёт жест (вкл. инерцию и перекрестие), окно не едет за
  // live-данными; без зума окно всегда на всех данных, как раньше.
  useAnimatedReaction(
    () =>
      zoomEnabled && (inspecting.value || panActive.value || pinchActive.value),
    (next, previous) => {
      if (next === previous) return;
      interacting.value = next;
      if (!next && previous) settle();
    },
    [zoomEnabled, inspecting, panActive, pinchActive, interacting, settle],
  );

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
          yNice={yNice}
          animateYDomain={animateYDomain}
          viewport={viewport}
          xPaddingRatio={xPaddingRatio}
          yPaddingRatio={yPaddingRatio}
          xReverse={xReverse}
          yReverse={yReverse}
          interaction={baseInteractionState}
          onChange={onChange}
        >
          <ChartCanvas gesture={gesture}>{children}</ChartCanvas>
        </ChartProvider>
      )}
    </View>
  );
};
