import { useEffect } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { ListStore } from "../model";
import type { IListSharedValues } from "../types";

const write = <T>(
  target: SharedValue<T> | undefined,
  value: T | undefined,
): void => {
  if (!target || value === undefined) return;

  target.value = value;
};

/**
 * Публикация состояния списка в shared values вызывающего кода.
 *
 * Нужна тем, кто строит анимации поверх списка: значения приходят на UI-поток,
 * а не через рендер. Смещение скролла отдаётся напрямую — оно уже живёт на
 * UI-потоке.
 */
export const useListSharedValues = (
  store: ListStore,
  scrollOffset: SharedValue<number>,
  sharedValues: IListSharedValues | undefined,
): void => {
  useEffect(() => {
    if (!sharedValues) return;

    const { activeStickyStartIndex, activeStickyEndIndex, isNearEnd } =
      sharedValues;

    write(activeStickyStartIndex, store.peek("activeStickyStartIndex"));
    write(activeStickyEndIndex, store.peek("activeStickyEndIndex"));
    write(isNearEnd, store.peek("isNearEnd"));

    if (sharedValues.scrollOffset) {
      sharedValues.scrollOffset.value = scrollOffset.value;
    }

    const unsubscribes = [
      activeStickyStartIndex &&
        store.listen("activeStickyStartIndex", value =>
          write(activeStickyStartIndex, value),
        ),
      activeStickyEndIndex &&
        store.listen("activeStickyEndIndex", value =>
          write(activeStickyEndIndex, value),
        ),
      isNearEnd && store.listen("isNearEnd", value => write(isNearEnd, value)),
    ].filter(Boolean) as (() => void)[];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [store, scrollOffset, sharedValues]);
};
