import { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import {
  clamp,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ITransitionContext, TTransitionDirection } from "../Transition.types";

export const useTransitionContext = (): ITransitionContext => {
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const isDrag = useSharedValue(false);
  const transitionX = useSharedValue(0);
  const transitionY = useSharedValue(0);
  const prevScrollX = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const navbarOffset = useSharedValue(0);
  const direction = useSharedValue<TTransitionDirection>(null);
  const prevDirection = useSharedValue<TTransitionDirection>(null);
  const isBouncing = useSharedValue(false);

  const showNavbar = () => {
    "worklet";
    navbarOffset.value = withTiming(0, { duration: 150 });
  };

  const hideNavbar = () => {
    "worklet";
    navbarOffset.value = withTiming(navbarHeight, { duration: 150 });
  };

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      isDrag.value = true;
      isBouncing.value = false;
      prevDirection.value = null;
      direction.value = null;
    },
    onEndDrag: () => {
      isDrag.value = false;

      // const offset = navbarOffset.value;
      // const isDownScroll = direction.value === "down";
      // const isUpScroll = direction.value === "up";
      //
      // if (isDownScroll && offset !== navbarHeight) {
      //   hideNavbar();
      // } else if (isUpScroll && offset !== 0) {
      //   showNavbar();
      // }

      prevDirection.value = direction.value;
      prevScrollX.value = 0;
      prevScrollY.value = 0;
    },
    onScroll: ({ contentOffset: { x, y } }) => {
      transitionX.value = x;
      transitionY.value = y;

      if (prevScrollY.value === 0) {
        prevScrollY.value = y;
      }
      // Определяем направление скролла
      if (prevScrollY.value !== y) {
        direction.value = y > prevScrollY.value ? "down" : "up";
      } else if (prevScrollX.value !== x) {
        direction.value = x > prevScrollX.value ? "right" : "left";
      }

      if (
        !isDrag.value &&
        direction.value !== null &&
        prevDirection.value !== null &&
        prevDirection.value !== direction.value
      ) {
        isBouncing.value = true;
      }

      if (isBouncing.value) {
        if (prevDirection.value === "down") {
          hideNavbar();
        } else if (prevDirection.value === "up") {
          showNavbar();
        }
      } else if (navbarHeight) {
        if (y > 0) {
          const delta = clamp(y - prevScrollY.value, -3, 3);
          const offset = navbarOffset.value;

          // Показываем или скрываем navbar
          if (delta > 0) {
            navbarOffset.value = Math.min(offset + delta, navbarHeight);
          } else {
            navbarOffset.value = Math.max(offset + delta, 0);
          }
        } else {
          showNavbar();
        }
      } else if (__DEV__) {
        console.warn("Navbar height is not defined");
      }

      prevScrollX.value = x;
      prevScrollY.value = y;
    },
  });

  const onLayoutNavBar = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setNavbarHeight(nativeEvent.layout.height);
  }, []);

  const onLayoutTabBar = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setTabBarHeight(nativeEvent.layout.height);
  }, []);

  return {
    navbarHeight,
    tabBarHeight,
    isDrag,
    transitionX,
    transitionY,
    scrollDirection: direction,
    onScroll,
    navbarOffset,
    showNavbar,
    hideNavbar,
    setNavbarHeight,
    onLayoutNavBar,
    setTabBarHeight,
    onLayoutTabBar,
  };
};
