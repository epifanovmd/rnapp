import type { ReactNode } from "react";

import type { ITextFieldProps } from "../input";

export type SelectValue = string | number;

export interface SelectOption<V extends SelectValue = string> {
  value: V;
  label: ReactNode;
  /** Текстовая форма `label` для поиска, поля и `LabeledValue`,
   *  когда `label` — не строка. */
  textLabel?: string;
  /** Подпись под вариантом в списке шторки. */
  description?: string;
  disabled?: boolean;
}

export interface SelectOptionGroup<V extends SelectValue = string> {
  group: string;
  options: SelectOption<V>[];
}

/** Пропсы, которые отдаёт стратегия загрузки и принимает Select. */
export interface SelectDataProps<V extends SelectValue = string> {
  options: SelectOption<V>[];
  loading?: boolean;
  loadingMore?: boolean;
  /** Есть ещё страницы (infinite-стратегия). */
  hasMore?: boolean;
  /** Ошибка последней загрузки. */
  error?: unknown;
  /**
   * Строка поиска в шторке: `true` / `false` — принудительно; без значения —
   * только у длинного списка или при серверном поиске (`onSearch`).
   */
  search?: boolean;
  searchValue?: string;
  onSearch?: (query: string) => void;
  /** Список докручен до конца — догрузка следующей страницы. */
  onScrollEnd?: () => void;
  onOpenChange?: (open: boolean) => void;
}

// ─── Filter / Render ──────────────────────────────────────────────────────

export type FilterOptionPredicate<V extends SelectValue = string> = (
  query: string,
  option: SelectOption<V>,
) => boolean;

export interface OptionRenderInfo<V extends SelectValue = string> {
  option: SelectOption<V>;
  index: number;
  selected: boolean;
  disabled: boolean;
}

export type OptionRenderer<V extends SelectValue = string> = (
  info: OptionRenderInfo<V>,
) => ReactNode;

export interface TagRenderInfo<V extends SelectValue = string> {
  value: V;
  label: string;
  disabled: boolean;
  onRemove: () => void;
}

export interface ValueRenderInfo<V extends SelectValue = string> {
  values: V[];
  labels: string[];
}

// ─── LabelInValue ─────────────────────────────────────────────────────────

export interface LabeledValue<V extends SelectValue = string> {
  value: V;
  label?: string;
}

// ─── Ref API ──────────────────────────────────────────────────────────────

export interface SelectRef {
  /** Открыть/закрыть шторку программно. */
  open: (open?: boolean) => void;
  /** Прокрутить открытый список к опции по индексу в `options`. */
  scrollTo: (index: number) => void;
}

// ─── Creatable / Virtual ──────────────────────────────────────────────────

/** Создание опции из строки поиска. Вернувшееся значение (сразу или через
 *  Promise) выбирается; `undefined` — ничего не выбирать (например, отказ). */
export type SelectCreateHandler<V extends SelectValue = string> = (
  query: string,
) => V | undefined | void | Promise<V | undefined | void>;

export interface SelectVirtualConfig {
  /** Оценка высоты строки в px (по умолчанию 52). */
  estimateSize?: number;
  /** Строк за пределами видимой области (по умолчанию 8). */
  overscan?: number;
}

// ─── Field ────────────────────────────────────────────────────────────────

/** Внешний вид поля-триггера и шторки. */
export interface SelectFieldProps {
  /** Подпись внутри поля; по умолчанию — и заголовок шторки. */
  label?: string;
  placeholder?: string;
  /** Подсказка под полем. */
  description?: string;
  /** Сообщение валидации под полем (красная рамка). */
  errorMessage?: string;
  /** Заголовок шторки; по умолчанию — `label`. */
  title?: string;
  disabled?: boolean;
  /** Предел высоты шторки по контенту, px. */
  maxHeight?: number;
}

export interface SelectBaseProps<V extends SelectValue = string>
  extends SelectFieldProps, SelectDataProps<V> {
  /** Управляемое состояние шторки (вместе с `onOpenChange`). */
  open?: boolean;
  /** Контент пустого списка (по умолчанию «Нет вариантов»). */
  empty?: ReactNode;
  /** Контент при `error` (по умолчанию «Не удалось загрузить»). */
  errorContent?: ReactNode;
  /** Опции по группам; `options` при этом — плоский список тех же опций. */
  groups?: SelectOptionGroup<V>[];
  optionRender?: OptionRenderer<V>;
  /** Свой узел значения в поле (single и multi без тегов). */
  renderValue?: (info: ValueRenderInfo<V>) => ReactNode;
  /** Свой тег в multi-режиме. */
  tagRender?: (info: TagRenderInfo<V>) => ReactNode;
  onSelect?: (value: V, option: SelectOption<V>) => void;
  onDeselect?: (value: V, option: SelectOption<V>) => void;
  /** Без поиска — не открывать шторку, пока нет опций и ничего не грузится
   *  (open флаг всё равно меняется); с поиском — не показывать заглушку
   *  пустого списка. */
  hideEmpty?: boolean;
  /** Закрывать шторку при очистке значения (по умолчанию true). */
  closeOnClear?: boolean;
  /** Клиентская фильтрация по строке поиска. По умолчанию включена, пока
   *  поиском владеет сам Select (нет `onSearch`); стратегии фильтруют сами. */
  filterOption?: boolean | FilterOptionPredicate<V>;
  /** Пункт «Создать «запрос»» над списком, когда поиск не совпадает ни с
   *  одной опцией точно (без учёта регистра). Работает вместе с `search`. */
  creatable?: boolean;
  /** Выбор пункта «Создать»: добавить опцию и вернуть её значение. */
  onCreate?: SelectCreateHandler<V>;
  /** Текст пункта «Создать» (по умолчанию «Создать «запрос»»). */
  createLabel?: (query: string) => ReactNode;
  /** Виртуализация длинного списка (AnchorList): рендерятся только видимые
   *  строки, заголовки групп прилипают к верху. Не задано — сама, если
   *  вариантов больше 50; `false` — отключить. */
  virtual?: boolean | SelectVirtualConfig;
}

// ─── Value modes (discriminated union) ────────────────────────────────────

interface SelectSingleProps<V extends SelectValue = string> {
  multi?: false;
  clearable?: false;
  labelInValue?: false;
  value?: V | null;
  onChange?: (value: V) => void;
}

interface SelectSingleClearableProps<V extends SelectValue = string> {
  multi?: false;
  clearable: true;
  labelInValue?: false;
  value?: V | null;
  onChange?: (value: V | null) => void;
}

interface SelectSingleLabeledProps<V extends SelectValue = string> {
  multi?: false;
  clearable?: false;
  labelInValue: true;
  value?: LabeledValue<V> | null;
  onChange?: (value: LabeledValue<V>) => void;
}

interface SelectSingleLabeledClearableProps<V extends SelectValue = string> {
  multi?: false;
  clearable: true;
  labelInValue: true;
  value?: LabeledValue<V> | null;
  onChange?: (value: LabeledValue<V> | null) => void;
}

export interface SelectMultiDisplayProps {
  /** Выбранное — тегами в поле (по умолчанию); `false` — текстом через запятую. */
  tagsDisplay?: boolean;
  /** Сколько тегов показать; остальные — «+N». */
  maxTagCount?: number;
}

interface SelectMultiProps<
  V extends SelectValue = string,
> extends SelectMultiDisplayProps {
  multi: true;
  clearable?: boolean;
  labelInValue?: false;
  value?: V[];
  onChange?: (value: V[]) => void;
}

interface SelectMultiLabeledProps<
  V extends SelectValue = string,
> extends SelectMultiDisplayProps {
  multi: true;
  clearable?: boolean;
  labelInValue: true;
  value?: LabeledValue<V>[];
  onChange?: (value: LabeledValue<V>[]) => void;
}

interface SelectDynamicMultiProps<
  V extends SelectValue = string,
> extends SelectMultiDisplayProps {
  multi: boolean;
  clearable?: boolean;
  labelInValue?: false;
  value?: V | V[] | null;
  onChange?: (value: V | V[] | null) => void;
}

export type SelectProps<V extends SelectValue = string> = SelectBaseProps<V> &
  (
    | SelectSingleProps<V>
    | SelectSingleClearableProps<V>
    | SelectSingleLabeledProps<V>
    | SelectSingleLabeledClearableProps<V>
    | SelectMultiProps<V>
    | SelectMultiLabeledProps<V>
    | SelectDynamicMultiProps<V>
  );

/** Omit по каждой ветке union — режимы значений не схлопываются. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type GroupedSelectProps<V extends SelectValue = string> =
  DistributiveOmit<SelectProps<V>, "options" | "groups"> & {
    groups: SelectOptionGroup<V>[];
  };

// ─── Autocomplete ───────────────────────────────────────────────────────────

type AutocompleteOmittedProps =
  | "search"
  | "searchValue"
  | "onDeselect"
  | "groups"
  | "renderValue"
  | "tagRender"
  | "creatable"
  | "onCreate"
  | "createLabel"
  | "filterOption";

/** Настройки клавиатуры поля ввода Autocomplete. */
export type AutocompleteInputProps = Pick<
  ITextFieldProps,
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "keyboardType"
  | "maxLength"
  | "returnKeyType"
  | "textContentType"
>;

export interface AutocompleteProps<V extends string = string> extends Omit<
  SelectBaseProps<V>,
  AutocompleteOmittedProps
> {
  /** Текст поля. Выбор опции подставляет `option.value`,
   *  `label` — только отображение в списке. */
  value?: string;
  /** Вызывается при вводе текста и при выборе опции. */
  onChange?: (value: string) => void;
  /** Кнопка очистки в поле (по умолчанию включена). */
  clearable?: boolean;
  /** Настройки клавиатуры поля ввода. */
  inputProps?: AutocompleteInputProps;
}
