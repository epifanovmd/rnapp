import { Group, Line, matchFont, Text, vec } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import type { ChartLayerComponent } from "../../core/types";

export interface AxisLayerProps {
  /** Какую ось рисует этот экземпляр — по одной оси на `<AxisLayer>`, можно рендерить несколько. */
  orientation: "x" | "y";
  /** С какой стороны рисовать (по умолчанию: низ для `x`, лево для `y`). Только рисует там — место под неё не резервирует, настраивайте `padding` у `<Chart>` отдельно. */
  position?: "top" | "bottom" | "left" | "right";
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число подписей/делений (через `scale.ticks()`). */
  tickCount?: number;
  /** Форматирует значение деления в текст подписи (даты, проценты и т.п.). */
  formatLabel?: (value: number) => string;
  /** Цвет линий делений. */
  color?: string;
  /** Рисовать основную линию оси. */
  showAxisLine?: boolean;
  /** Толщина линии оси (px). */
  lineWidth?: number;
  /** Цвет текста подписей. */
  labelColor?: string;
  /** Размер шрифта подписей. */
  fontSize?: number;
  /** Шрифт подписей (передаётся в `matchFont`). */
  fontFamily?: string;
  /** Рисовать засечки делений. */
  showTicks?: boolean;
  /** Длина засечек (px). */
  tickLength?: number;
}

const defaultFormatLabel = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

export const AxisLayer: ChartLayerComponent<AxisLayerProps> = ({
  orientation,
  position,
  visible = true,
  tickCount = 5,
  formatLabel = defaultFormatLabel,
  color = "#94A3B8",
  showAxisLine = true,
  lineWidth = 1,
  labelColor = "#64748B",
  fontSize = 11,
  fontFamily = "System",
  showTicks = false,
  tickLength = 4,
}) => {
  const { xScale, yScale, dimensions } = useChartContext();
  const font = useMemo(
    () => matchFont({ fontFamily, fontSize }),
    [fontFamily, fontSize],
  );

  if (!visible || !font) {
    return null;
  }

  if (orientation === "x") {
    const isTop = position === "top";
    const axisY = isTop
      ? dimensions.padding.top
      : dimensions.height - dimensions.padding.bottom;
    const tickEndY = isTop ? axisY - tickLength : axisY + tickLength;
    const labelY = isTop ? axisY - 6 : axisY + fontSize + 6;

    return (
      <Group>
        {showAxisLine && (
          <Line
            p1={vec(dimensions.padding.left, axisY)}
            p2={vec(dimensions.width - dimensions.padding.right, axisY)}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {xScale.ticks(tickCount).map((tick, index) => {
          const label = formatLabel(tick);
          const textWidth = font.measureText(label).width;
          const x = xScale.toRange(tick);

          return (
            <Group key={index}>
              {showTicks && (
                <Line
                  p1={vec(x, axisY)}
                  p2={vec(x, tickEndY)}
                  color={color}
                  strokeWidth={lineWidth}
                />
              )}
              <Text
                x={x - textWidth / 2}
                y={labelY}
                text={label}
                font={font}
                color={labelColor}
              />
            </Group>
          );
        })}
      </Group>
    );
  }

  const isRight = position === "right";
  const axisX = isRight
    ? dimensions.width - dimensions.padding.right
    : dimensions.padding.left;
  const tickEndX = isRight ? axisX + tickLength : axisX - tickLength;

  return (
    <Group>
      {showAxisLine && (
        <Line
          p1={vec(axisX, dimensions.padding.top)}
          p2={vec(axisX, dimensions.height - dimensions.padding.bottom)}
          color={color}
          strokeWidth={lineWidth}
        />
      )}
      {yScale.ticks(tickCount).map((tick, index) => {
        const label = formatLabel(tick);
        const textWidth = font.measureText(label).width;
        const y = yScale.toRange(tick);
        const x = isRight ? axisX + 8 : axisX - textWidth - 8;

        return (
          <Group key={index}>
            {showTicks && (
              <Line
                p1={vec(axisX, y)}
                p2={vec(tickEndX, y)}
                color={color}
                strokeWidth={lineWidth}
              />
            )}
            <Text
              x={x}
              y={y + fontSize * 0.3}
              text={label}
              font={font}
              color={labelColor}
            />
          </Group>
        );
      })}
    </Group>
  );
};

AxisLayer.layerKind = "skia";
