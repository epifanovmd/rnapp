import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries } from "../types";
import {
  computeTrendDirection,
  TrendColorMap,
  TrendCompareMode,
} from "../utils";

export type {
  TrendColorMap,
  TrendCompareMode,
  TrendDirection,
} from "../utils/compute-trend-direction";

/** Дефолтные цвета роста/падения/отсутствия изменений — общие для `LineLayer`, `AreaLayer`. */
export const DEFAULT_TREND_UP_COLOR = "#10B981";
export const DEFAULT_TREND_DOWN_COLOR = "#EF4444";
export const DEFAULT_TREND_NEUTRAL_COLOR = "#94A3B8";

export interface UseTrendColorOptions {
  seriesShared: SharedValue<IChartSeries[]>;
  seriesId: string;
  compare: TrendCompareMode;
  enabled: boolean;
  fallback: string;
  palette: TrendColorMap;
}

export const useTrendColor = ({
  seriesShared,
  seriesId,
  compare,
  enabled,
  fallback,
  palette,
}: UseTrendColorOptions): DerivedValue<string> =>
  useDerivedValue(() => {
    if (!enabled) {
      return fallback;
    }

    const item = seriesShared.value.find(
      candidate => candidate.id === seriesId,
    );
    const direction = item ? computeTrendDirection(item.data, compare) : null;

    return direction ? palette[direction] : fallback;
  }, [seriesShared, seriesId, compare, enabled, fallback, palette]);
