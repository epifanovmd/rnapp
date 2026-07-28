import { DashPathEffect, Group, Line, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import type { ChartLayerComponent } from "../../core/types";

export interface GridLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число вертикальных линий сетки (через `xScale.ticks()`). */
  xTickCount?: number;
  /** Примерное число горизонтальных линий сетки (через `yScale.ticks()`). */
  yTickCount?: number;
  /** Рисовать вертикальные линии. */
  showXLines?: boolean;
  /** Рисовать горизонтальные линии. */
  showYLines?: boolean;
  /** Цвет линий. */
  color?: string;
  /** Толщина линий (px). */
  strokeWidth?: number;
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
}

export const GridLayer: ChartLayerComponent<GridLayerProps> = ({
  visible = true,
  xTickCount = 5,
  yTickCount = 5,
  showXLines = true,
  showYLines = true,
  color = "#E2E8F0",
  strokeWidth = 1,
  lineType = "solid",
  dashArray,
}) => {
  const { xScale, yScale, dimensions } = useChartContext();

  if (!visible) {
    return null;
  }

  const top = dimensions.padding.top;
  const bottom = dimensions.height - dimensions.padding.bottom;
  const left = dimensions.padding.left;
  const right = dimensions.width - dimensions.padding.right;
  const intervals = resolveDashIntervals(lineType, dashArray);

  return (
    <Group>
      {showYLines &&
        yScale.ticks(yTickCount).map((tick, index) => {
          const y = yScale.toRange(tick);

          return (
            <Line
              key={`y-${index}`}
              p1={vec(left, y)}
              p2={vec(right, y)}
              color={color}
              strokeWidth={strokeWidth}
            >
              {intervals && <DashPathEffect intervals={intervals} />}
            </Line>
          );
        })}
      {showXLines &&
        xScale.ticks(xTickCount).map((tick, index) => {
          const x = xScale.toRange(tick);

          return (
            <Line
              key={`x-${index}`}
              p1={vec(x, top)}
              p2={vec(x, bottom)}
              color={color}
              strokeWidth={strokeWidth}
            >
              {intervals && <DashPathEffect intervals={intervals} />}
            </Line>
          );
        })}
    </Group>
  );
};

GridLayer.layerKind = "skia";
