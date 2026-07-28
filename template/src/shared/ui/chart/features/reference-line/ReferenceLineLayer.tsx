import {
  DashPathEffect,
  Group,
  Line,
  matchFont,
  Text,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import type { ChartLayerComponent } from "../../core/types";

export interface ReferenceLineLayerProps {
  visible?: boolean;
  axis: "x" | "y";
  value: number;
  color?: string;
  strokeWidth?: number;
  lineType?: LineDashType;
  dashArray?: number[];
  label?: string;
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const ReferenceLineLayer: ChartLayerComponent<
  ReferenceLineLayerProps
> = ({
  visible = true,
  axis,
  value,
  color = "#EF4444",
  strokeWidth = 1,
  lineType = "dashed",
  dashArray,
  label,
  labelColor = "#EF4444",
  fontSize = 11,
  fontFamily = "System",
}) => {
  const { xScale, yScale, dimensions } = useChartContext();
  const intervals = resolveDashIntervals(lineType, dashArray);
  const font = useMemo(
    () => matchFont({ fontFamily, fontSize }),
    [fontFamily, fontSize],
  );

  if (!visible || !font) {
    return null;
  }

  if (axis === "y") {
    const y = yScale.toRange(value);
    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;
    const labelWidth = label ? font.measureText(label).width : 0;

    return (
      <Group>
        <Line
          p1={vec(left, y)}
          p2={vec(right, y)}
          color={color}
          strokeWidth={strokeWidth}
        >
          {intervals && <DashPathEffect intervals={intervals} />}
        </Line>
        {label && (
          <Text
            x={right - labelWidth - 4}
            y={y - 4}
            text={label}
            font={font}
            color={labelColor}
          />
        )}
      </Group>
    );
  }

  const x = xScale.toRange(value);
  const top = dimensions.padding.top;
  const bottom = dimensions.height - dimensions.padding.bottom;

  return (
    <Group>
      <Line
        p1={vec(x, top)}
        p2={vec(x, bottom)}
        color={color}
        strokeWidth={strokeWidth}
      >
        {intervals && <DashPathEffect intervals={intervals} />}
      </Line>
      {label && (
        <Text
          x={x + 4}
          y={top + fontSize + 2}
          text={label}
          font={font}
          color={labelColor}
        />
      )}
    </Group>
  );
};

ReferenceLineLayer.layerKind = "skia";
