import { LinearGradient, Path, vec } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";
import { withOpacity } from "../../core/with-opacity";
import { computeBaselineY } from "../../scales/compute-baseline";
import { buildAreaPath, CurveType } from "../line/build-line-path";

export interface AreaLayerProps extends SeriesSelector {
  visible?: boolean;
  curve?: CurveType;
  opacity?: number;
  colors?: string[];
  gradient?: boolean;
  baseline?: number;
}

export const AreaLayer: ChartLayerComponent<AreaLayerProps> = ({
  visible = true,
  curve = "linear",
  opacity = 0.25,
  colors = DEFAULT_SERIES_COLORS,
  gradient = true,
  baseline,
  ...selector
}) => {
  const { series, xScale, yScale, dimensions } = useChartContext();
  const resolvedSeries = selectSeries(series, selector);
  const baselineY = useMemo(
    () => computeBaselineY(yScale, baseline),
    [yScale, baseline],
  );

  const paths = useMemo(
    () =>
      resolvedSeries.map(item => ({
        id: item.id,
        color: item.color,
        path: buildAreaPath(item.data, xScale, yScale, curve, baselineY),
      })),
    [resolvedSeries, xScale, yScale, curve, baselineY],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {paths.map((item, index) => {
        const color = resolveSeriesColor(item, index, colors);

        return (
          <Path
            key={item.id}
            path={item.path}
            style="fill"
            color={gradient ? undefined : withOpacity(color, opacity)}
          >
            {gradient && (
              <LinearGradient
                start={vec(0, dimensions.padding.top)}
                end={vec(0, dimensions.height - dimensions.padding.bottom)}
                colors={[withOpacity(color, opacity), withOpacity(color, 0)]}
              />
            )}
          </Path>
        );
      })}
    </>
  );
};

AreaLayer.layerKind = "skia";
