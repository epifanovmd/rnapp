import {
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { IBar, resolveCollapseRange } from "../bars";
import {
  ISearchBarOpenPlan,
  planSearchBarOpen,
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
 * `useNavbarScrollSync({ paused })`.
 */
export const useSearchBarSync = (
  search: ISearchController,
  bar: IBar,
  { hideBar = true, restore = "previous" }: ISearchBarSyncOptions = {},
): ISearchBarSync => {
  const { activeValue } = search;
  const { offset, height, pinned, duration } = bar;
  const contentShift = useSharedValue(0);
  const plan = useSharedValue<ISearchBarOpenPlan>(IDLE_PLAN);

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
        if (next.hide) {
          bar.hide();
          contentShift.value = withTiming(next.shift, { duration });
        }

        return;
      }

      if (shouldShowBarOnClose(restore, plan.value)) bar.show();
      contentShift.value = withTiming(0, { duration });
      plan.value = IDLE_PLAN;
    },
    [activeValue, offset, height, pinned, bar, duration, hideBar, restore],
  );

  const shiftRange = useDerivedValue(
    () => (hideBar ? resolveCollapseRange(height.value, pinned.value) : 0),
    [hideBar, height, pinned],
  );

  return { contentShift, shiftRange };
};
