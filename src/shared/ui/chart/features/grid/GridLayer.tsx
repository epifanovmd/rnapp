import { DashPathEffect, Group, Path, Skia } from "@shopify/react-native-skia";
import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  DASH_PRESETS,
  isInScaleRange,
  scaleToRange,
  useAxisTicks,
  useChartGeometry,
} from "../../core";
import type { GridLayerProps } from "./types";

/** Сетка: линии делений X/Y одним путём на ось, следуют за окном на UI-потоке. */
export const GridLayer = React.memo(
  ({
    visible = true,
    xTickCount = 5,
    yTickCount = 5,
    xTicks = "nice",
    yTicks = "nice",
    showXLines = true,
    showYLines = true,
    color = "#E2E8F0",
    strokeWidth = 1,
    lineType = "solid",
    dashArray,
  }: GridLayerProps) => {
    const { xScale, yScale, plot } = useChartGeometry();
    const intervals = dashArray ?? DASH_PRESETS[lineType];
    const xTickSet = useAxisTicks(xScale, xTicks, xTickCount);
    const yTickSet = useAxisTicks(yScale, yTicks, yTickCount);
    const { left, right, top, bottom } = plot;

    const xPath = useDerivedValue(() => {
      const builder = Skia.PathBuilder.Make();
      const scale = xScale.value;

      for (const value of xTickSet.value.values) {
        const x = scaleToRange(scale, value);

        if (isInScaleRange(scale, x, 0.5)) {
          builder.moveTo(x, top);
          builder.lineTo(x, bottom);
        }
      }

      return builder.detach();
    }, [xScale, xTickSet, top, bottom]);

    const yPath = useDerivedValue(() => {
      const builder = Skia.PathBuilder.Make();
      const scale = yScale.value;

      for (const value of yTickSet.value.values) {
        const y = scaleToRange(scale, value);

        if (isInScaleRange(scale, y, 0.5)) {
          builder.moveTo(left, y);
          builder.lineTo(right, y);
        }
      }

      return builder.detach();
    }, [yScale, yTickSet, left, right]);

    if (!visible) {
      return null;
    }

    return (
      <Group>
        {showYLines && (
          <Path
            path={yPath}
            style={"stroke"}
            color={color}
            strokeWidth={strokeWidth}
          >
            {intervals && <DashPathEffect intervals={intervals} />}
          </Path>
        )}
        {showXLines && (
          <Path
            path={xPath}
            style={"stroke"}
            color={color}
            strokeWidth={strokeWidth}
          >
            {intervals && <DashPathEffect intervals={intervals} />}
          </Path>
        )}
      </Group>
    );
  },
);
