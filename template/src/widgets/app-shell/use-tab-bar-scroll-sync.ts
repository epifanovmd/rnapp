import { useIsFocused } from "@react-navigation/native";
import { resolveScrollEdge } from "@shared/lib/bars";
import { IScrollValues } from "@shared/lib/scroll";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";

import { useTabBar } from "./tab-bar";
import { accumulateToggle } from "./tab-bar-toggle";

/** Дистанция скролла в одну сторону для переключения панели, px */
const TOGGLE_THRESHOLD = 12;

/**
 * Поведение таб-панели: прячется и показывается целиком после накопления
 * порога — на отпускании доводить нечего, состояние всегда крайнее.
 */
export const useTabBarScrollSync = (scroll: IScrollValues) => {
  const tabBar = useTabBar();
  // по одному значению: захват объекта целиком клонировал бы его на UI-поток
  const { offsetY, overscrollTop, overscrollBottom } = scroll;
  const accumulated = useSharedValue(0);
  const isFocused = useIsFocused();
  const { offset: barOffset } = tabBar;

  useAnimatedReaction(
    () => barOffset.value === 0,
    (isShown, wasShown) => {
      if ((isShown && wasShown === false) || !isFocused) {
        accumulated.value = 0;
      }
    },
    [isFocused],
  );

  useAnimatedReaction(
    () => offsetY.value,
    (offset, prevOffset) => {
      if (prevOffset === null || offset === prevOffset) {
        return;
      }

      const edge = resolveScrollEdge(
        offset,
        overscrollTop.value,
        overscrollBottom.value,
      );

      if (edge) {
        accumulated.value = 0;

        if (edge === "top") {
          tabBar.show();
        } else {
          tabBar.hide();
        }

        return;
      }

      const result = accumulateToggle(
        accumulated.value,
        offset - prevOffset,
        TOGGLE_THRESHOLD,
      );

      accumulated.value = result.accumulated;

      if (result.command === "hide") {
        tabBar.hide();
      } else if (result.command === "show") {
        tabBar.show();
      }
    },
    [tabBar],
  );
};
