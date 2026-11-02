import { Group, RoundedRect } from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ChartLayerComponent, IChartSeries } from "../../core";
import {
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  matchChartFont,
  scaleToRange,
  useChartActiveIndices,
  useChartGeometry,
  useChartGesture,
  useChartSeries,
} from "../../core";
import { TooltipRow } from "./TooltipRow";
import type { ActiveTooltipPoint, TooltipLayerProps } from "./types";

const DOT_RADIUS = 4;

const defaultFormatRow = (point: ActiveTooltipPoint) => {
  const { x, y, label } = point.datum;

  return label
    ? `${point.series.label ?? point.series.id}: ${label} (x=${x}, y=${y})`
    : `${point.series.label ?? point.series.id}: x=${x}, y=${y}`;
};

const collectPoints = (
  series: IChartSeries[],
  index: number,
  touch: ActiveTooltipPoint["touch"],
): ActiveTooltipPoint[] =>
  index < 0
    ? []
    : series
        .filter(item => item.data[index] !== undefined)
        .map(item => ({
          series: item,
          datum: item.data[index],
          color: item.color,
          touch,
        }));

export const TooltipLayer: ChartLayerComponent<TooltipLayerProps> = ({
  visible = true,
  placement = "above-left",
  offset = 12,
  backgroundColor = "rgba(15, 23, 42, 0.92)",
  textColor = "#FFFFFF",
  fontSize = 12,
  fontFamily = "System",
  formatRow = defaultFormatRow,
  anchorToPoint = false,
  side = "top",
  showSecondTouch = true,
  onVisibilityChange,
}) => {
  const { series, seriesShared } = useChartSeries();
  const { dimensions, xScale, yScale } = useChartGeometry();
  const { touchX, touchY, isActive, touchX2, touchY2, isSecondActive } =
    useChartGesture();
  const { activeIndices, activeIndices2, jsIndices, jsIndices2 } =
    useChartActiveIndices();

  const font = useMemo(
    () => matchChartFont(fontFamily, fontSize),
    [fontFamily, fontSize],
  );

  const activeIndex = jsIndices[0] ?? -1;
  const activeIndex2 = jsIndices2[0] ?? -1;
  const secondIndex = showSecondTouch ? activeIndex2 : -1;

  const points: ActiveTooltipPoint[] = useMemo(() => {
    const primary = collectPoints(series, activeIndex, "primary");
    const secondary = collectPoints(series, secondIndex, "secondary");

    return secondIndex >= 0 && secondIndex < activeIndex
      ? [...secondary, ...primary]
      : [...primary, ...secondary];
  }, [series, activeIndex, secondIndex]);

  const rowHeight = fontSize + 6;

  const rows = useMemo(
    () =>
      points.map(point => ({
        id: `${point.touch}-${point.series.id}`,
        text: formatRow(point),
        color: point.color,
      })),
    [points, formatRow],
  );

  const metrics = font ? rows.map(row => font.measureText(row.text)) : [];
  const textWidth = metrics.reduce((max, m) => Math.max(max, m.width), 0);
  const boxWidth = textWidth + DOT_RADIUS * 2 + LABEL_PADDING_X * 3;
  const boxHeight = Math.max(rows.length, 1) * rowHeight + LABEL_PADDING_Y * 2;

  const anchorPoint = useDerivedValue(() => {
    const resolve = (index: number, x: number, y: number) => {
      const target =
        anchorToPoint && index >= 0
          ? seriesShared.value[0]?.data[index]
          : undefined;

      return target
        ? {
            x: scaleToRange(xScale.value, target.x),
            y: scaleToRange(yScale.value, target.y),
          }
        : { x, y };
    };

    const first = resolve(
      activeIndices.value[0] ?? -1,
      touchX.value,
      touchY.value,
    );

    if (!showSecondTouch || !isSecondActive.value) {
      return first;
    }

    const second = resolve(
      activeIndices2.value[0] ?? -1,
      touchX2.value,
      touchY2.value,
    );

    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  }, [
    anchorToPoint,
    showSecondTouch,
    activeIndices,
    activeIndices2,
    seriesShared,
    xScale,
    yScale,
    touchX,
    touchY,
    touchX2,
    touchY2,
    isSecondActive,
  ]);

  const boxX = useDerivedValue(() => {
    const minLeft = dimensions.padding.left;
    const maxLeft = Math.max(
      minLeft,
      dimensions.width - dimensions.padding.right - boxWidth,
    );

    if (placement === "top-left") {
      return minLeft;
    }

    if (placement === "top-right") {
      return maxLeft;
    }

    if (placement === "above-left") {
      const leftOfFinger = anchorPoint.value.x - boxWidth - offset;
      const x =
        leftOfFinger >= minLeft ? leftOfFinger : anchorPoint.value.x + offset;

      return Math.min(Math.max(x, minLeft), maxLeft);
    }

    let rawLeft = anchorPoint.value.x - boxWidth / 2;

    if (side === "left") {
      rawLeft = anchorPoint.value.x - boxWidth - offset;
    } else if (side === "right") {
      rawLeft = anchorPoint.value.x + offset;
    }

    return Math.min(Math.max(rawLeft, minLeft), maxLeft);
  }, [anchorPoint, boxWidth, placement, side, offset, dimensions]);

  const boxY = useDerivedValue(() => {
    const minTop = dimensions.padding.top;
    const maxTop = Math.max(
      minTop,
      dimensions.height - dimensions.padding.bottom - boxHeight,
    );

    if (placement === "top-left" || placement === "top-right") {
      return minTop;
    }

    if (placement === "above-left") {
      const aboveFinger = anchorPoint.value.y - boxHeight - offset;

      return Math.min(Math.max(aboveFinger, minTop), maxTop);
    }

    let rawTop = anchorPoint.value.y - boxHeight / 2;

    if (side === "top") {
      rawTop = anchorPoint.value.y - boxHeight - offset;
    } else if (side === "bottom") {
      rawTop = anchorPoint.value.y + offset;
    }

    return Math.min(Math.max(rawTop, minTop), maxTop);
  }, [anchorPoint, boxHeight, placement, side, offset, dimensions]);

  const opacity = useDerivedValue(
    () => (isActive.value && rows.length > 0 ? 1 : 0),
    [isActive, rows.length],
  );

  useAnimatedReaction(
    () => isActive.value,
    (next, previous) => {
      if (next !== previous && onVisibilityChange) {
        scheduleOnRN(onVisibilityChange, next);
      }
    },
    [isActive, onVisibilityChange],
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
