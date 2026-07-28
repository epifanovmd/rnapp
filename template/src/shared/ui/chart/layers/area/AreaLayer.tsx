import { LinearGradient, Path, vec } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import {
  computeTrend,
  resolveTrendColor,
  TrendCompareMode,
} from "../../core/compute-trend";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";
import { withOpacity } from "../../core/with-opacity";
import { computeBaselineY } from "../../scales/compute-baseline";
import { buildAreaPath, CurveType } from "../line/build-line-path";

export interface AreaLayerProps extends SeriesSelector {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Прямые сегменты или сглаженная (catmull-rom) кривая. */
  curve?: CurveType;
  /** Непрозрачность заливки (0–1). */
  opacity?: number;
  /** Цвета по сериям (по кругу, если серий больше); переопределяется собственным `series.color`. Игнорируется при `colorByTrend`. */
  colors?: string[];
  /** Заливка градиентом (к прозрачному) вместо сплошного цвета. */
  gradient?: boolean;
  /** Значение Y, от которого закрывается область (по умолчанию — 0 в пределах домена). */
  baseline?: number;
  /** Красить заливку каждой серии по её тренду (рост/падение) вместо `colors`/`series.color`. */
  colorByTrend?: boolean;
  /** С чем сравнивать при определении тренда: с первой точкой серии или с предыдущей. */
  trendCompare?: TrendCompareMode;
  /** Цвет при росте (используется вместе с `colorByTrend`). */
  upColor?: string;
  /** Цвет при падении (используется вместе с `colorByTrend`). */
  downColor?: string;
  /** Цвет при отсутствии изменения (используется вместе с `colorByTrend`). */
  neutralColor?: string;
}

export const AreaLayer: ChartLayerComponent<AreaLayerProps> = ({
  visible = true,
  curve = "linear",
  opacity = 0.25,
  colors = DEFAULT_SERIES_COLORS,
  gradient = true,
  baseline,
  colorByTrend = false,
  trendCompare = "previous",
  upColor = "#10B981",
  downColor = "#EF4444",
  neutralColor = "#94A3B8",
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
      resolvedSeries.map((item, index) => ({
        id: item.id,
        color: colorByTrend
          ? resolveTrendColor(
              computeTrend(item.data, trendCompare)?.direction ?? "flat",
              upColor,
              downColor,
              neutralColor,
            )
          : resolveSeriesColor(item, index, colors),
        path: buildAreaPath(item.data, xScale, yScale, curve, baselineY),
      })),
    [
      resolvedSeries,
      xScale,
      yScale,
      curve,
      baselineY,
      colors,
      colorByTrend,
      trendCompare,
      upColor,
      downColor,
      neutralColor,
    ],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {paths.map(item => (
        <Path
          key={item.id}
          path={item.path}
          style="fill"
          color={gradient ? undefined : withOpacity(item.color, opacity)}
        >
          {gradient && (
            <LinearGradient
              start={vec(0, dimensions.padding.top)}
              end={vec(0, dimensions.height - dimensions.padding.bottom)}
              colors={[
                withOpacity(item.color, opacity),
                withOpacity(item.color, 0),
              ]}
            />
          )}
        </Path>
      ))}
    </>
  );
};

AreaLayer.layerKind = "skia";
