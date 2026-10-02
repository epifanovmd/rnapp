import {
  resolveCollapseRange,
  resolveFollowDelta,
  resolveReleaseTarget,
  resolveScrollEdge,
} from "@shared/lib/bars";
import { IScrollValues } from "@shared/lib/scroll";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";

import { useNavbar } from "./navbar-bar";

/** Скачок смещения за тик больше этого — не жест, а смена вкладки/программный скролл, px */
const MAX_FOLLOW_JUMP = 200;

/**
 * Поведение навигационной панели: под пальцем следует за скроллом
 * попиксельно; на отпускании сразу доезжает до состояния по направлению
 * жеста и на инерции за пикселями не следует — анимация не спорит со сдвигом,
 * и после остановки контента панели доезжать нечего.
 */
export const useNavbarScrollSync = (scroll: IScrollValues) => {
  const navbar = useNavbar();
  // по одному значению: захват объекта целиком клонировал бы его на UI-поток
  const {
    offsetY,
    overscrollTop,
    overscrollBottom,
    maxOffsetY,
    isDragging,
    isMomentum,
    direction,
  } = scroll;
  /** Палец отпущен, панель доезжает сама — до следующего жеста или конца инерции. */
  const settling = useSharedValue(false);

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
        maxOffsetY.value,
      );

      if (edge === "top") {
        navbar.show();
      } else if (edge === "bottom") {
        navbar.hide();
      } else if (!settling.value) {
        const delta = offset - prevOffset;

        navbar.shift(resolveFollowDelta(delta, MAX_FOLLOW_JUMP));
      }
    },
    [navbar],
  );

  useAnimatedReaction(
    () => isDragging.value,
    (dragging, wasDragging) => {
      if (dragging) {
        settling.value = false;

        return;
      }
      if (!wasDragging) return;

      settling.value = true;

      const target = resolveReleaseTarget(
        navbar.offset.value,
        resolveCollapseRange(navbar.height.value, navbar.pinned.value),
        direction.value,
      );

      if (target === "hide") {
        navbar.hide();
      } else {
        navbar.show();
      }
    },
    [navbar],
  );

  useAnimatedReaction(
    () => isMomentum.value,
    (momentum, wasMomentum) => {
      if (wasMomentum && !momentum) {
        settling.value = false;
      }
    },
  );
};
