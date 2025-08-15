import { useState } from "react";
import {
  clamp,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ITransitionContext, TTransitionDirection } from "../Transition.types";

export const useTransitionContext = (): ITransitionContext => {
  const [navbarHeight, setNavbarHeight] = useState(0);
  const isDrag = useSharedValue(false);
  const transitionX = useSharedValue(0);
  const transitionY = useSharedValue(0);
  const prevScrollX = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const navbarOffset = useSharedValue(0);
  const direction = useSharedValue<TTransitionDirection>(null);

  const showNavbar = () => {
    "worklet";
    navbarOffset.value = withTiming(0);
  };

  const hideNavbar = () => {
    "worklet";
    navbarOffset.value = withTiming(navbarHeight);
  };

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      isDrag.value = true;
    },
    onEndDrag: () => {
      isDrag.value = false;

      const offset = navbarOffset.value;
      const isDownScroll = direction.value === "down";
      const isUpScroll = direction.value === "up";

      if (isDownScroll && offset !== navbarHeight) {
        hideNavbar();
      } else if (isUpScroll && offset !== 0) {
        showNavbar();
      }

      direction.value = null;
      prevScrollX.value = 0;
      prevScrollY.value = 0;
    },
    onScroll: ({ contentOffset: { x, y } }) => {
      transitionX.value = x;
      transitionY.value = y;

      if (prevScrollY.value === 0) {
        prevScrollY.value = y;
      }

      const delta = clamp(y - prevScrollY.value, -3, 3);

      if (isDrag.value) {
        const offset = navbarOffset.value;

        // Показываем или скрываем navbar
        if (delta > 0) {
          navbarOffset.value = Math.min(offset + delta, navbarHeight);
        } else {
          navbarOffset.value = Math.max(offset + delta, 0);
        }

        // Определяем направление скролла
        if (prevScrollY.value !== y) {
          direction.value = y > prevScrollY.value ? "down" : "up";
        } else if (prevScrollX.value !== x) {
          direction.value = x > prevScrollX.value ? "right" : "left";
        }
      }

      prevScrollX.value = x;
      prevScrollY.value = y;
    },
  });

  return {
    navbarHeight,
    isDrag,
    transitionX,
    transitionY,
    scrollDirection: direction,
    onScroll,
    navbarOffset,
    showNavbar,
    hideNavbar,
    setNavbarHeight,
  };
};
