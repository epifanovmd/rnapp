import {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useCarousel } from "../carousel-context";
import { TCarouselProgressBarsMode } from "../carousel-progress-bars.types";

interface ICarouselProgressTimer {
  timer: SharedValue<number>;
  timerIndex: SharedValue<number>;
}

export const useCarouselProgressTimer = (
  mode: TCarouselProgressBarsMode,
): ICarouselProgressTimer => {
  const { autoplayActive, activeIndex, cycleDuration, touching } =
    useCarousel();
  const timer = useSharedValue(0);
  const timerIndex = useSharedValue(activeIndex.value);

  useAnimatedReaction(
    () => activeIndex.value,
    (current, previous) => {
      if (mode !== "timer" || current === previous) {
        return;
      }

      cancelAnimation(timer);
      timer.value = 0;
      timerIndex.value = current;

      if (autoplayActive.value && !touching.value) {
        timer.value = withTiming(1, {
          duration: cycleDuration.value,
          easing: Easing.linear,
        });
      }
    },
    [mode],
  );

  useAnimatedReaction(
    () => touching.value,
    (isTouching, wasTouching) => {
      if (
        mode !== "timer" ||
        wasTouching === null ||
        isTouching === wasTouching
      ) {
        return;
      }

      if (isTouching) {
        cancelAnimation(timer);

        return;
      }

      if (autoplayActive.value && timer.value < 1) {
        timer.value = withTiming(1, {
          duration: (1 - timer.value) * cycleDuration.value,
          easing: Easing.linear,
        });
      }
    },
    [mode],
  );

  return { timer, timerIndex };
};
