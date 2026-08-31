import { resolveScrollEdge } from "@shared/lib/bars";
import { IScrollTelemetry } from "@shared/lib/scroll";
import { useAnimatedReaction } from "react-native-reanimated";

import { useNavbar } from "./navbar-bar";

/** Максимальный сдвиг панели за один scroll-тик, px */
const MAX_FOLLOW_DELTA = 3;

/**
 * Поведение навигационной панели: следует за скроллом попиксельно и
 * доводится до ближайшего состояния, когда жест и инерция закончились.
 */
export const useNavbarScrollSync = (telemetry: IScrollTelemetry) => {
  const navbar = useNavbar();
  // по одному значению: захват телеметрии целиком клонировал бы на UI-поток
  // и её scrollHandler
  const { offsetY, overscrollTop, overscrollBottom, isDragging, isMomentum } =
    telemetry;

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

      if (edge === "top") {
        navbar.show();
      } else if (edge === "bottom") {
        navbar.hide();
      } else {
        const delta = offset - prevOffset;

        navbar.shift(
          Math.min(Math.max(delta, -MAX_FOLLOW_DELTA), MAX_FOLLOW_DELTA),
        );
      }
    },
    [navbar],
  );

  useAnimatedReaction(
    () => isDragging.value || isMomentum.value,
    (isActive, wasActive) => {
      if (wasActive && !isActive) {
        navbar.snap();
      }
    },
    [navbar],
  );
};
