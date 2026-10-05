import {
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { IBar, resolveCollapseRange } from "../bars";
import type { IScrollValues } from "../scroll";
import {
  ISearchBarOpenPlan,
  planSearchBarOpen,
  resolveReleasedShift,
  resolveSearchGapShift,
  shouldShowBarOnClose,
} from "./search-bar-plan";
import type { ISearchController } from "./use-search";

export interface ISearchBarSyncOptions {
  /** Прятать видимую шапку при открытии поиска. По умолчанию `true`. */
  hideBar?: boolean;
  /**
   * Шапка после закрытия поиска: `"previous"` — как было до открытия,
   * `"show"` — всегда показать. По умолчанию `"previous"`.
   */
  restore?: "previous" | "show";
}

export interface ISearchBarSync {
  /**
   * На сколько поднять контент вслед за шапкой, спрятанной поиском, px —
   * трансформом (`SearchShiftView`), в одном кадре с шапкой.
   */
  contentShift: SharedValue<number>;
  /** Наибольший сдвиг — ход скрытия шапки: на столько контейнер контента продлён вниз. */
  shiftRange: DerivedValue<number>;
}

const IDLE_PLAN: ISearchBarOpenPlan = { hide: false, shift: 0 };

/**
 * Поиск в закреплённой части скрываемой шапки (`HiddenBar.StickyContent`):
 * открытие прячет видимую шапку (`hideBar`) — строка поиска встаёт на её
 * место, контент поднимается той же анимацией (длительность панели) через
 * трансформ `SearchShiftView`; уже скрытую шапку не трогает. Закрытие
 * возвращает шапку по `restore`. Скролл во время поиска шапку не двигает —
 * `useNavbarScrollSync({ paused })`; если прокрутка контента стала меньше
 * скрытой части шапки (фильтр укоротил список), контент поднимается на
 * разницу, а при закрытии шапка показывается. Закрытие во время скролла
 * (фокус ушёл из-за жеста) шапку не трогает — ею управляет скролл, а сдвиг
 * контента уходит вместе с её появлением.
 */
export const useSearchBarSync = (
  search: ISearchController,
  bar: IBar,
  scroll: IScrollValues,
  { hideBar = true, restore = "previous" }: ISearchBarSyncOptions = {},
): ISearchBarSync => {
  const { activeValue } = search;
  const { offset, height, pinned, duration } = bar;
  const { offsetY, maxOffsetY, isDragging, isMomentum } = scroll;
  const contentShift = useSharedValue(0);
  /** Конечное значение `contentShift` — без чтения идущей анимации. */
  const shiftTarget = useSharedValue(0);
  const plan = useSharedValue<ISearchBarOpenPlan>(IDLE_PLAN);
  /** Сдвиг, оставленный закрытием во время скролла: уходит с появлением шапки. */
  const pending = useSharedValue(0);

  const animateShift = (next: number) => {
    "worklet";
    shiftTarget.value = next;
    contentShift.value = withTiming(next, { duration });
  };

  useAnimatedReaction(
    () => activeValue.value,
    (active, previous) => {
      if (previous === null || active === previous) return;

      if (active) {
        if (!hideBar) return;

        const next = planSearchBarOpen(
          offset.value,
          resolveCollapseRange(height.value, pinned.value),
        );

        plan.value = next;
        pending.value = 0;
        if (next.hide) {
          bar.hide();
          animateShift(shiftTarget.value + next.shift);
        }

        return;
      }

      const scrolled = Math.min(offsetY.value, maxOffsetY.value);
      const scrolling = isDragging.value || isMomentum.value;

      const show = shouldShowBarOnClose(
        restore,
        plan.value,
        offset.value,
        scrolled,
        scrolling,
      );

      plan.value = IDLE_PLAN;
      if (show) bar.show();
      if (scrolling) {
        // Шапку не трогать — сдвиг уйдёт вместе с её появлением.
        pending.value = shiftTarget.value;

        return;
      }
      animateShift(0);
    },
    [
      activeValue,
      offset,
      height,
      pinned,
      bar,
      duration,
      hideBar,
      restore,
      offsetY,
      maxOffsetY,
      isDragging,
      isMomentum,
    ],
  );

  useAnimatedReaction(
    () =>
      activeValue.value || pending.value <= 0
        ? null
        : resolveReleasedShift(pending.value, offset.value),
    next => {
      if (next === null || next >= pending.value) return;

      pending.value = next;
      shiftTarget.value = next;
      contentShift.value = next;
    },
    [activeValue, offset],
  );

  useAnimatedReaction(
    () => {
      if (!activeValue.value) return null;

      // Шапку, которую прячет сам поиск, считать уже доехавшей.
      const hidden = plan.value.hide
        ? resolveCollapseRange(height.value, pinned.value)
        : offset.value;

      return resolveSearchGapShift(
        shiftTarget.value,
        hidden,
        offsetY.value,
        maxOffsetY.value,
      );
    },
    next => {
      if (next !== null && next > shiftTarget.value + 0.5) animateShift(next);
    },
    [activeValue, plan, height, pinned, offset, offsetY, maxOffsetY],
  );

  const shiftRange = useDerivedValue(
    () => (hideBar ? resolveCollapseRange(height.value, pinned.value) : 0),
    [hideBar, height, pinned],
  );

  return { contentShift, shiftRange };
};
