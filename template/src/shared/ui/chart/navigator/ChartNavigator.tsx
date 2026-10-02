import {
  Canvas,
  Group,
  Rect,
  RoundedRect,
  Skia,
} from "@shopify/react-native-skia";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import {
  buildLinePathFromPoints,
  ChartViewport,
  createLinearScale,
  IChartSeries,
  scaleToDomain,
  scaleToRange,
  useSeriesLod,
  visibleSlice,
} from "../core";
import { computeDomain } from "../scales/compute-domain";
import {
  applyNavigatorDrag,
  centerRangeAt,
  NavigatorDragMode,
  resolveNavigatorDrag,
} from "./navigator-drag";
import { NavigatorLine } from "./NavigatorLine";

export interface ChartNavigatorProps {
  series: IChartSeries[];
  viewport: ChartViewport;
  /** Высота, px. По умолчанию 48. */
  height?: number;
  /** Отступы по X — как у основного графика, чтобы рамка совпала с ним по краям. */
  paddingLeft?: number;
  paddingRight?: number;
  /** Цвет линий серий (по умолчанию — цвет серии). */
  lineColor?: string;
  /** Затемнение вне окна. */
  maskColor?: string;
  /** Рамка окна и ручки. */
  windowColor?: string;
}

/** Зона захвата края рамки, px. */
const HANDLE_HIT = 16;
const HANDLE_WIDTH = 4;
const VERTICAL_INSET = 4;
const DEFAULT_PAN_ACTIVE_OFFSET_X: [number, number] = [-4, 4];
const DEFAULT_PAN_FAIL_OFFSET_Y: [number, number] = [-10, 10];

/**
 * Навигатор окна: мини-график всех данных и рамка видимого окна. Рамку
 * можно перетащить, тянуть за края, тап вне рамки переносит её в точку.
 * Работает на том же `ChartViewport`, что и основной график.
 */
export const ChartNavigator: FC<ChartNavigatorProps> = ({
  series,
  viewport,
  height = 48,
  paddingLeft = 16,
  paddingRight = 16,
  lineColor,
  maskColor = "rgba(100, 116, 139, 0.18)",
  windowColor = "#3B82F6",
}) => {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setWidth(previous => (previous === next ? previous : next));
  }, []);

  const left = paddingLeft;
  const right = Math.max(width - paddingRight, left + 1);
  const top = VERTICAL_INSET;
  const bottom = height - VERTICAL_INSET;

  const xBounds = useMemo(() => computeDomain(series, "x"), [series]);
  const yBounds = useMemo(
    () => computeDomain(series, "y", { paddingRatio: 0.1 }),
    [series],
  );

  const seriesShared = useSharedValue(series);

  useEffect(() => {
    seriesShared.value = series;
  }, [series, seriesShared]);

  const lod = useSeriesLod(seriesShared);
  const { start, end, boundsMin, boundsMax, worklets } = viewport;
  const { limits, range, setNow, animateTo, notify, stop, settle } = worklets;
  const fallbackMin = xBounds[0];
  const fallbackMax = xBounds[1];

  const xScale = useDerivedValue(() => {
    const min = Number.isFinite(boundsMin.value)
      ? boundsMin.value
      : fallbackMin;
    const max = Number.isFinite(boundsMax.value)
      ? boundsMax.value
      : fallbackMax;

    return createLinearScale([min, max], [left, right]);
  }, [boundsMin, boundsMax, fallbackMin, fallbackMax, left, right]);

  const yScale = useMemo(
    () => createLinearScale(yBounds, [bottom, top]),
    [yBounds, bottom, top],
  );

  const paths = useDerivedValue(() => {
    const x = xScale.value;
    const maxPoints = Math.max(right - left, 16);

    return lod.value.map(item => {
      const slice = visibleSlice(item.levels, x.d0, x.d1, maxPoints);

      if (!slice) {
        return Skia.PathBuilder.Make().detach();
      }

      const points = item.levels[slice.level];
      const pixels = [];

      for (let index = slice.from; index <= slice.to; index++) {
        pixels.push({
          x: scaleToRange(x, points[index].x),
          y: scaleToRange(yScale, points[index].y),
        });
      }

      return buildLinePathFromPoints(pixels, "linear");
    });
  }, [lod, xScale, yScale, left, right]);

  // До первых данных окно NaN — рамка на всю ширину.
  const windowLeft = useDerivedValue(() => {
    const pixel = scaleToRange(xScale.value, start.value);

    return Number.isFinite(pixel) ? Math.max(pixel, left) : left;
  }, [xScale, start, left]);

  const windowRight = useDerivedValue(() => {
    const pixel = scaleToRange(xScale.value, end.value);

    return Number.isFinite(pixel) ? Math.min(pixel, right) : right;
  }, [xScale, end, right]);

  const windowWidth = useDerivedValue(
    () => Math.max(windowRight.value - windowLeft.value, 1),
    [windowLeft, windowRight],
  );
  const leftMaskWidth = useDerivedValue(
    () => Math.max(windowLeft.value - left, 0),
    [windowLeft, left],
  );
  const rightMaskWidth = useDerivedValue(
    () => Math.max(right - windowRight.value, 0),
    [windowRight, right],
  );
  const leftHandleX = useDerivedValue(
    () => windowLeft.value - HANDLE_WIDTH / 2,
    [windowLeft],
  );
  const rightHandleX = useDerivedValue(
    () => windowRight.value - HANDLE_WIDTH / 2,
    [windowRight],
  );

  const mode = useSharedValue<NavigatorDragMode>("move");
  const { interacting } = viewport;

  const pan = usePanGesture({
    activeOffsetX: DEFAULT_PAN_ACTIVE_OFFSET_X,
    failOffsetY: DEFAULT_PAN_FAIL_OFFSET_Y,
    onBegin: event => {
      mode.value = resolveNavigatorDrag(
        event.x,
        windowLeft.value,
        windowRight.value,
        HANDLE_HIT,
      );
    },
    onActivate: event => {
      stop();
      interacting.value = true;

      if (mode.value === "jump") {
        setNow(
          centerRangeAt(
            range(),
            scaleToDomain(xScale.value, event.x),
            limits(),
          ),
        );
        mode.value = "move";
      }
    },
    onUpdate: event => {
      const x = xScale.value;
      const delta = (event.changeX / Math.max(x.r1 - x.r0, 1)) * (x.d1 - x.d0);

      setNow(applyNavigatorDrag(mode.value, range(), delta, limits()));
    },
    onDeactivate: () => {
      notify();
    },
    onFinalize: () => {
      if (interacting.value) {
        interacting.value = false;
        settle();
      }
    },
  });

  const tap = useTapGesture({
    onActivate: event => {
      animateTo(
        centerRangeAt(range(), scaleToDomain(xScale.value, event.x), limits()),
      );
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <GestureDetector gesture={gesture}>
          <Canvas style={StyleSheet.absoluteFill}>
            {series.map((item, index) => (
              <NavigatorLine
                key={item.id}
                index={index}
                paths={paths}
                color={lineColor ?? item.color}
              />
            ))}
            <Rect
              x={left}
              y={top}
              width={leftMaskWidth}
              height={bottom - top}
              color={maskColor}
            />
            <Rect
              x={windowRight}
              y={top}
              width={rightMaskWidth}
              height={bottom - top}
              color={maskColor}
            />
            <Rect
              x={windowLeft}
              y={top}
              width={windowWidth}
              height={bottom - top}
              color={windowColor}
              style={"stroke"}
              strokeWidth={1}
            />
            <Group>
              <RoundedRect
                x={leftHandleX}
                y={top + (bottom - top) / 4}
                width={HANDLE_WIDTH}
                height={(bottom - top) / 2}
                r={2}
                color={windowColor}
              />
              <RoundedRect
                x={rightHandleX}
                y={top + (bottom - top) / 4}
                width={HANDLE_WIDTH}
                height={(bottom - top) / 2}
                r={2}
                color={windowColor}
              />
            </Group>
          </Canvas>
        </GestureDetector>
      )}
    </View>
  );
};
