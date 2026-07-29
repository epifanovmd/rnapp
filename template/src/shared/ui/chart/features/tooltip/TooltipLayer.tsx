import { Group, matchFont, RoundedRect } from "@shopify/react-native-skia";
import React, { useMemo, useRef, useState } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ChartLayerComponent } from "../../core";
import {
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  useChartActiveIndices,
  useChartGeometry,
  useChartGesture,
  useChartSeries,
} from "../../core";
import { TooltipRow } from "./TooltipRow";
import type { ActiveTooltipPoint, TooltipLayerProps } from "./types";

const DOT_RADIUS = 4;

const defaultFormatRow = (point: ActiveTooltipPoint) =>
  `${point.series.label ?? point.series.id}: ${point.datum.label ?? point.datum.y}`;

export const TooltipLayer: ChartLayerComponent<TooltipLayerProps> = ({
  visible = true,
  offset = 12,
  backgroundColor = "rgba(15, 23, 42, 0.92)",
  textColor = "#FFFFFF",
  fontSize = 12,
  fontFamily = "System",
  formatRow = defaultFormatRow,
  anchorToPoint = false,
  side = "top",
  onVisibilityChange,
}) => {
  const { series, geometry } = useChartSeries();
  const { dimensions } = useChartGeometry();
  const { touchX, touchY, isActive } = useChartGesture();
  const { activeIndices } = useChartActiveIndices();

  const font = useMemo(
    () => matchFont({ fontFamily, fontSize }),
    [fontFamily, fontSize],
  );

  // Читаем индекс активной точки напрямую из `activeIndices` (DerivedValue) —
  // тултипу нужен только первый (скалярный) индекс, а не весь массив по
  // сериям, поэтому мирим его в JS локально, тем же паттерном, что и
  // Crosshair/`Chart.onChange`.
  const [activeIndex, setActiveIndex] = useState(
    () => activeIndices.value[0] ?? -1,
  );

  useAnimatedReaction(
    () => activeIndices.value[0] ?? -1,
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(setActiveIndex, next);
      }
    },
    [activeIndices],
  );

  const points: ActiveTooltipPoint[] = useMemo(
    () =>
      activeIndex < 0
        ? []
        : series
            .filter(item => item.data[activeIndex] !== undefined)
            .map(item => ({
              series: item,
              datum: item.data[activeIndex],
              color: item.color,
            })),
    [series, activeIndex],
  );

  const rowHeight = fontSize + 6;

  const rows = useMemo(
    () =>
      points.map(point => ({
        id: point.series.id,
        text: formatRow(point),
        color: point.color,
      })),
    [points, formatRow],
  );

  const metrics = font ? rows.map(row => font.measureText(row.text)) : [];
  const textWidth = metrics.reduce((max, m) => Math.max(max, m.width), 0);
  const boxWidth = textWidth + DOT_RADIUS * 2 + LABEL_PADDING_X * 3;
  const boxHeight = Math.max(rows.length, 1) * rowHeight + LABEL_PADDING_Y * 2;

  const firstSeriesId = series[0]?.id;

  const anchorPoint = useDerivedValue(() => {
    const index = activeIndices.value[0] ?? -1;
    const target =
      anchorToPoint && firstSeriesId && index >= 0
        ? geometry.value[firstSeriesId]?.[index]
        : undefined;

    return {
      x: target ? target.x : touchX.value,
      y: target ? target.y : touchY.value,
    };
  }, [anchorToPoint, activeIndices, geometry, touchX, touchY, firstSeriesId]);

  const boxX = useDerivedValue(() => {
    const minLeft = dimensions.padding.left;
    const maxLeft = Math.max(
      minLeft,
      dimensions.width - dimensions.padding.right - boxWidth,
    );

    let rawLeft = anchorPoint.value.x - boxWidth / 2;

    if (side === "left") {
      rawLeft = anchorPoint.value.x - boxWidth - offset;
    } else if (side === "right") {
      rawLeft = anchorPoint.value.x + offset;
    }

    return Math.min(Math.max(rawLeft, minLeft), maxLeft);
  }, [anchorPoint, boxWidth, side, offset, dimensions]);

  const boxY = useDerivedValue(() => {
    const minTop = dimensions.padding.top;
    const maxTop = Math.max(
      minTop,
      dimensions.height - dimensions.padding.bottom - boxHeight,
    );

    let rawTop = anchorPoint.value.y - boxHeight / 2;

    if (side === "top") {
      rawTop = anchorPoint.value.y - boxHeight - offset;
    } else if (side === "bottom") {
      rawTop = anchorPoint.value.y + offset;
    }

    return Math.min(Math.max(rawTop, minTop), maxTop);
  }, [anchorPoint, boxHeight, side, offset, dimensions]);

  const opacity = useDerivedValue(() => (isActive.value ? 1 : 0), [isActive]);

  const onVisibilityChangeRef = useRef(onVisibilityChange);

  onVisibilityChangeRef.current = onVisibilityChange;

  useAnimatedReaction(
    () => isActive.value,
    (next, previous) => {
      if (next !== previous && onVisibilityChangeRef.current) {
        scheduleOnRN(onVisibilityChangeRef.current, next);
      }
    },
    [isActive],
  );

  if (!visible || !font) {
    return null;
  }

  return (
    <Group opacity={opacity}>
      <RoundedRect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        r={8}
        color={backgroundColor}
      />
      {rows.map((row, index) => (
        <TooltipRow
          key={row.id}
          index={index}
          boxX={boxX}
          boxY={boxY}
          text={row.text}
          dotColor={row.color}
          font={font}
          fontSize={fontSize}
          textColor={textColor}
          paddingX={LABEL_PADDING_X}
          paddingY={LABEL_PADDING_Y}
          rowHeight={rowHeight}
          dotRadius={DOT_RADIUS}
        />
      ))}
    </Group>
  );
};
