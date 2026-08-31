import { resolveScrollEdge } from "@shared/lib/bars";
import { IScrollTelemetry } from "@shared/lib/scroll";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";

import { useTabBar } from "./tab-bar";
import { accumulateToggle } from "./tab-bar-toggle";

/** Дистанция скролла в одну сторону для переключения панели, px */
const TOGGLE_THRESHOLD = 12;

/**
 * Поведение таб-панели: прячется и показывается целиком после накопления
 * порога — на отпускании доводить нечего, состояние всегда крайнее.
 */
export const useTabBarScrollSync = (telemetry: IScrollTelemetry) => {
  const tabBar = useTabBar();
  // по одному значению: захват телеметрии целиком клонировал бы на UI-поток
  // и её scrollHandler
  const { offsetY, overscrollTop, overscrollBottom } = telemetry;
  const accumulated = useSharedValue(0);

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
