import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries, IScale } from "../types";

/** Результат useActiveIndices — производное значение с индексами. */
export interface ActiveIndices {
  indices: DerivedValue<number[]>;
}

/** Возвращает индексы точек, ближайших к позиции касания, для каждой серии. */
export const useActiveIndices = (
  seriesShared: SharedValue<IChartSeries[]>,
  xScale: IScale,
  touchX: SharedValue<number>,
  isActive: SharedValue<boolean>,
): ActiveIndices => {
  const indices = useDerivedValue(() => {
    if (!isActive.value) {
      return seriesShared.value.map(() => -1);
    }

    const targetX = xScale.toDomain(touchX.value);

    return seriesShared.value.map(item => {
      const data = item.data;
      const length = data.length;

      if (length === 0) {
        return -1;
      }

      // Бинарный поиск ближайшей по x точки серии.
      let low = 0;
      let high = length - 1;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);

        if (data[mid].x < targetX) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      if (
        low > 0 &&
        Math.abs(data[low - 1].x - targetX) <= Math.abs(data[low].x - targetX)
      ) {
        return low - 1;
      }

      return low;
    });
  }, [seriesShared, xScale, touchX, isActive]);

  return { indices };
};
