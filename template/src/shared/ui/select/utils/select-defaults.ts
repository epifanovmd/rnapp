import type { ReactNode } from "react";

import type { SelectVirtualConfig } from "../types";

export const SELECT_DEFAULT_PLACEHOLDER = "Не выбрано";
/** Предел высоты шторки по умолчанию, px. */
export const SELECT_DEFAULT_MAX_HEIGHT = 560;
export const SELECT_EMPTY_TEXT = "Нет вариантов";
export const SELECT_NOT_FOUND_TEXT = "Ничего не найдено";
export const SELECT_ERROR_TEXT = "Не удалось загрузить";

const DEFAULT_VIRTUAL: Required<SelectVirtualConfig> = {
  estimateSize: 52,
  overscan: 8,
};

export const defaultCreateLabel = (query: string): ReactNode =>
  `Создать «${query}»`;

/** С какого числа вариантов список виртуализируется сам (без `virtual`). */
export const AUTO_VIRTUAL_THRESHOLD = 50;

/**
 * Настройки виртуализации или `null`, если список обычный. Без `virtual`
 * длинный список (больше `AUTO_VIRTUAL_THRESHOLD`) виртуализируется сам —
 * сотни строк в обычном скролле монтируются все разом; `false` — отключить.
 */
export const resolveVirtualConfig = (
  virtual: boolean | SelectVirtualConfig | undefined,
  optionCount: number,
): Required<SelectVirtualConfig> | null => {
  if (virtual === undefined) {
    return optionCount > AUTO_VIRTUAL_THRESHOLD ? DEFAULT_VIRTUAL : null;
  }
  if (!virtual) return null;

  return virtual === true
    ? DEFAULT_VIRTUAL
    : { ...DEFAULT_VIRTUAL, ...virtual };
};
