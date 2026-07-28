import { useEffect, useRef } from "react";

import { useChartContext } from "../../core/chart-context";
import { findActiveIndex } from "../../core/interaction/nearest-point";
import { useAnimatedSyncedState } from "../../core/interaction/useAnimatedSyncedState";
import type {
  ChartDatum,
  ChartLayerComponent,
  IChartSeries,
} from "../../core/types";

export interface ActivePoint {
  /** Серия, которой принадлежит активная точка. */
  series: IChartSeries;
  /** Ближайшая к касанию точка данных этой серии. */
  datum: ChartDatum;
}

export interface ActivePointListenerProps {
  /** Срабатывает при смене активной точки по каждой серии; `null`, когда касание закончилось. Ничего не рендерит — headless-слой для подписки на данные без Crosshair/Tooltip. */
  onChange?: (points: ActivePoint[] | null) => void;
}

export const ActivePointListener: ChartLayerComponent<
  ActivePointListenerProps
> = ({ onChange }) => {
  const { series, xScale, interaction } = useChartContext();
  const { touchX, isActive } = interaction;
  const referenceData = series[0]?.data ?? [];

  const activeIndex = useAnimatedSyncedState(
    () => {
      "worklet";

      return findActiveIndex(
        xScale,
        referenceData,
        touchX.value,
        isActive.value,
      );
    },
    [referenceData, xScale, touchX, isActive],
    -1,
  );

  const seriesRef = useRef(series);

  seriesRef.current = series;

  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    const currentOnChange = onChangeRef.current;

    if (!currentOnChange) {
      return;
    }

    if (activeIndex < 0) {
      currentOnChange(null);

      return;
    }

    const currentSeries = seriesRef.current;
    const points = currentSeries
      .filter(item => item.data[activeIndex] !== undefined)
      .map(item => ({ series: item, datum: item.data[activeIndex] }));

    currentOnChange(points.length > 0 ? points : null);
  }, [activeIndex]);

  return null;
};

ActivePointListener.layerKind = "overlay";
