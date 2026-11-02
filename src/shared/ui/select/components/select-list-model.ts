import type { ReactNode, RefObject } from "react";

import type {
  OptionRenderer,
  SelectValue,
  SelectVirtualConfig,
} from "../types";
import type { OptionRow } from "../utils";

/** Всё, что нужно списку шторки: строки, состояние загрузки и действия. */
export interface ISelectListModel<V extends SelectValue> {
  rows: OptionRow<V>[];
  multi: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: unknown;
  /** Заглушка пустого списка; `null` — не показывать. */
  empty: ReactNode;
  errorContent: ReactNode;
  optionRender?: OptionRenderer<V>;
  isSelected: (value: V) => boolean;
  /** Текст строки «Не выбрано» и её подсветка. */
  clearLabel?: string;
  clearActive?: boolean;
  /** Содержимое строки «Создать». */
  createContent?: ReactNode;
  onSelect: (value: V) => void;
  onClear: () => void;
  onCreate: () => void;
  onScrollEnd?: () => void;
  /** Регистрация прокрутки к опции по индексу в `options`. */
  scrollToIndexRef: RefObject<((index: number) => void) | null>;
  virtual: Required<SelectVirtualConfig> | null;
}

/** Есть ли что показать списком (иначе — состояние загрузки/ошибки/пусто). */
export const hasListContent = <V extends SelectValue>(
  model: ISelectListModel<V>,
): boolean =>
  !model.loading &&
  !model.error &&
  model.rows.some(row => row.kind === "option" || row.kind === "create");
