import {
  resolveCollapseRange,
  resolveFollowDelta,
  resolveFollowShift,
  resolveReleaseTarget,
  resolveScrollEdge,
} from "@shared/lib/bars";
import { IScrollValues } from "@shared/lib/scroll";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";

import { useNavbar } from "./navbar-bar";

/** Скачок смещения за тик больше этого — не жест, а смена вкладки/программный скролл, px */
const MAX_FOLLOW_JUMP = 200;

/**
 * Поведение навигационной панели: под пальцем следует за скроллом
 * попиксельно, но не дальше прокрутки контента; на отпускании сразу доезжает
 * до состояния по направлению жеста и на инерции за пикселями не следует —
 * анимация не спорит со сдвигом. Пока контент прокручен меньше хода скрытия,
 * панель не доводится ни вниз, ни вверх, а едет вместе с ним и на инерции.
 */
export interface INavbarScrollSyncOptions {
  /** Пока `true`, скролл панель не двигает (например, открыт поиск). */
  paused?: SharedValue<boolean>;
  /**
   * Сдвиг контента трансформом поверх скролла (`useSearchBarSync`), px:
   * считается частью прокрутки — у верха списка поднятый контент не
   * выдёргивает шапку.
   */
  contentShift?: SharedValue<number>;
}

export const useNavbarScrollSync = (
  scroll: IScrollValues,
  { paused, contentShift }: INavbarScrollSyncOptions = {},
) => {
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
      if (prevOffset === null || offset === prevOffset || paused?.value) {
        return;
      }

      // Видимая прокрутка: скролл плюс сдвиг контента трансформом.
      const scrolled = offset + (contentShift?.value ?? 0);
      const edge = resolveScrollEdge(
        scrolled,
        overscrollTop.value,
        overscrollBottom.value,
        maxOffsetY.value,
      );

      if (edge === "top") {
        navbar.show();
      } else if (edge === "bottom") {
        navbar.hide();
      } else if (!settling.value) {
        const step = resolveFollowDelta(offset - prevOffset, MAX_FOLLOW_JUMP);

        navbar.shift(
          step === 0
            ? 0
            : resolveFollowShift(navbar.offset.value, step, scrolled),
        );
      }
    },
    [navbar, paused, contentShift],
  );

  useAnimatedReaction(
    () => isDragging.value,
    (dragging, wasDragging) => {
      if (paused?.value) return;
      if (dragging) {
        settling.value = false;

        return;
      }
      if (!wasDragging) return;

      const target = resolveReleaseTarget(
        navbar.offset.value,
        resolveCollapseRange(navbar.height.value, navbar.pinned.value),
        direction.value,
        offsetY.value + (contentShift?.value ?? 0),
      );

      if (target === "follow") return;

      settling.value = true;

      if (target === "hide") {
        navbar.hide();
      } else {
        navbar.show();
      }
    },
    [navbar, paused, contentShift],
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
