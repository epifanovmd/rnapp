import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import { nearestIndexX } from "../lod/lod";
import { LinearScale, scaleToDomain } from "../scale/linear-scale";
import type { IChartSeries } from "../types";

/** Результат useActiveIndices — производное значение с индексами. */
export interface ActiveIndices {
  indices: DerivedValue<number[]>;
}

/** Индексы точек, ближайших по X к касанию, для каждой серии. */
export const useActiveIndices = (
  seriesShared: SharedValue<IChartSeries[]>,
  xScale: DerivedValue<LinearScale>,
  touchX: SharedValue<number>,
  isActive: SharedValue<boolean>,
): ActiveIndices => {
  const indices = useDerivedValue(() => {
    if (!isActive.value) {
      return seriesShared.value.map(() => -1);
    }

    const targetX = scaleToDomain(xScale.value, touchX.value);

    return seriesShared.value.map(item => nearestIndexX(item.data, targetX));
  }, [seriesShared, xScale, touchX, isActive]);

  return { indices };
};
