import React, { useMemo } from "react";

import type { ChartLayerComponent } from "../../core";
import {
  DEFAULT_TREND_DOWN_COLOR,
  DEFAULT_TREND_NEUTRAL_COLOR,
  DEFAULT_TREND_UP_COLOR,
  selectSeries,
  TrendColorMap,
  TrendCompareMode,
  useChartGeometry,
  useChartSeries,
} from "../../core";
import { CurveType } from "../../core";
import { computeBaselineY } from "../../scales";
import { AreaSeriesPath } from "./AreaSeriesPath";

export interface AreaLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Прямые сегменты или сглаженная (catmull-rom) кривая. */
  curve?: CurveType;
  /** Непрозрачность заливки (0–1). */
  opacity?: number;
  /** Заливка градиентом (к прозрачному) вместо сплошного цвета. */
  gradient?: boolean;
  /** Значение Y, от которого закрывается область (по умолчанию — 0 в пределах домена). */
  baseline?: number;
  /** Красить заливку каждой серии по её тренду (рост/падение) вместо `series.color`. Цвет считается на UI-потоке — на live-графике не требует JS-рендера слоя. */
  colorByTrend?: boolean;
  /** С чем сравнивать при определении тренда: с первой точкой серии или с предыдущей. */
  trendCompare?: TrendCompareMode;
  /** Цвета для `up`/`down`/`flat` направлений тренда. */
  trendColors?: Partial<TrendColorMap>;
  seriesId?: string;
}

export const AreaLayer: ChartLayerComponent<AreaLayerProps> = ({
  visible = true,
  curve = "linear",
  opacity = 0.25,
  gradient = true,
  baseline,
  colorByTrend = false,
  trendCompare = "previous",
  trendColors,
  seriesId,
}) => {
  const { series, seriesShared, geometry } = useChartSeries();
  const { yScale, dimensions } = useChartGeometry();
  const resolvedSeries = selectSeries(series, seriesId);
  const baselineY = useMemo(
    () => computeBaselineY(yScale, baseline),
    [yScale, baseline],
  );

  const palette = useMemo<TrendColorMap>(
    () => ({
      up: DEFAULT_TREND_UP_COLOR,
      down: DEFAULT_TREND_DOWN_COLOR,
      flat: DEFAULT_TREND_NEUTRAL_COLOR,
      ...trendColors,
    }),
    [trendColors],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {resolvedSeries.map(item => (
        <AreaSeriesPath
          key={item.id}
          seriesId={item.id}
          seriesShared={seriesShared}
          geometry={geometry}
          curve={curve}
          baselineY={baselineY}
          color={item.color}
          colorByTrend={colorByTrend}
          trendCompare={trendCompare}
          palette={palette}
          opacity={opacity}
          gradient={gradient}
          gradientTop={dimensions.padding.top}
          gradientBottom={dimensions.height - dimensions.padding.bottom}
        />
      ))}
    </>
  );
};
