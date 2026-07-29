import { useEffect, useRef, useState } from "react";
import { DerivedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ActivePoint, IChartSeries } from "../types";

/**
 * Реагирует на смену активной точки (первое касание) и вызывает `onChange`
 * с собранными `ActivePoint[]` или `null`.
 *
 * Вся коммуникация с worklet (`useAnimatedReaction` → `scheduleOnRN`)
 * и чтение свежих `series`/`onChange` через ref инкапсулирована здесь,
 * чтобы не засорять `ChartProvider`.
 */
export const useActivePointChange = (
  activeIndices: DerivedValue<number[]>,
  series: IChartSeries[],
  onChange?: ((points: ActivePoint[] | null) => void) | undefined,
): void => {
  const seriesRef = useRef(series);

  seriesRef.current = series;

  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const [activeIndex, setActiveIndex] = useState(
    () => activeIndices.value[0] ?? -1,
  );

  useAnimatedReaction(
    () => activeIndices.value[0] ?? -1,
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(setActiveIndex, next);
      }
    },
    [activeIndices],
  );

  useEffect(() => {
    const handler = onChangeRef.current;

    if (!handler) {
      return;
    }

    if (activeIndex < 0) {
      handler(null);

      return;
    }

    const currentSeries = seriesRef.current;
    const points: ActivePoint[] = currentSeries
      .filter(item => item.data[activeIndex] !== undefined)
      .map(item => ({ series: item, datum: item.data[activeIndex] }));

    handler(points.length > 0 ? points : null);
  }, [activeIndex]);
};
