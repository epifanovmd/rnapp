import { useEffect } from "react";
import { Animated } from "react-native";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const INDEX_DURATION = 200;

/**
 * Позиция пейджера как shared value: индикатор едет к активной вкладке при
 * смене `index` и за свайпом, когда позиция доходит до JS. Позицию пейджера
 * material-top-tabs ведёт нативный драйвер — его JS-слушатели не вызываются,
 * поэтому опираться только на `addListener` нельзя.
 */
export const usePagerProgress = (
  position: Animated.AnimatedInterpolation<number>,
  index: number,
): SharedValue<number> => {
  const progress = useSharedValue(index);

  useEffect(() => {
    progress.value = withTiming(index, { duration: INDEX_DURATION });
  }, [index, progress]);

  useEffect(() => {
    const id = position.addListener(({ value }) => {
      progress.value = value;
    });

    return () => position.removeListener(id);
  }, [position, progress]);

  return progress;
};
