import { ReactNode } from "react";

export type SelectValue = string | number;

export interface SelectOption<V extends SelectValue = string> {
  value: V;
  label: ReactNode;
  /** Текстовая форма `label` для поиска и поля, когда `label` — не строка. */
  textLabel?: string;
  /** Подпись под вариантом в списке. */
  description?: string;
  disabled?: boolean;
}

export interface ISelectProps<V extends SelectValue = string> {
  options: SelectOption<V>[];
  value?: V | null;
  onChange?: (value: V | null) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  /** Пункт «Не выбрано» в списке: сбрасывает значение в `null`. */
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Поиск по вариантам; по умолчанию — когда вариантов больше 8. */
  searchable?: boolean;
  /** Заголовок шторки; по умолчанию — `label`. */
  title?: string;
}
