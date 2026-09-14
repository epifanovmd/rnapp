import type { ConfigType, Dayjs } from "dayjs";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

/** Всё, что принимает `dayjs()`: Dayjs, Date, ISO-строка, timestamp. */
export type TCalendarDateInput = ConfigType;

/** Ключ дня `YYYY-MM-DD`. Строковое сравнение таких ключей совпадает с хронологическим. */
export type TCalendarDateKey = string;

/** Ключ месяца `YYYY-MM`. */
export type TCalendarMonthKey = string;

/** День недели по dayjs: 0 — воскресенье … 6 — суббота. */
export type TCalendarWeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---------------------------------------------------------------------------
// Выбор дат — дискриминантный union по `mode`
// ---------------------------------------------------------------------------

export interface ICalendarRange {
  start: Dayjs | null;
  end: Dayjs | null;
}

export interface ICalendarRangeInput {
  start?: TCalendarDateInput | null;
  end?: TCalendarDateInput | null;
}

export interface ICalendarNoneSelectionProps {
  mode?: "none";
}

export interface ICalendarSingleSelectionProps {
  mode: "single";
  value?: TCalendarDateInput | null;
  defaultValue?: TCalendarDateInput | null;
  onChange?: (date: Dayjs | null) => void;
  /** Повторный тап по выбранному дню снимает выбор. */
  allowDeselect?: boolean;
}

export interface ICalendarMultipleSelectionProps {
  mode: "multiple";
  value?: TCalendarDateInput[];
  defaultValue?: TCalendarDateInput[];
  onChange?: (dates: Dayjs[]) => void;
  /** Максимум выбранных дней; при достижении новые тапы игнорируются. */
  max?: number;
}

export interface ICalendarRangeSelectionProps {
  mode: "range";
  value?: ICalendarRangeInput | null;
  defaultValue?: ICalendarRangeInput | null;
  onChange?: (range: ICalendarRange) => void;
  /** Разрешить период из одного дня (тап по началу закрывает период). */
  allowSingleDay?: boolean;
  /** Максимальная длина периода в днях (включительно). */
  maxLength?: number;
}

export type TCalendarSelectionProps =
  | ICalendarNoneSelectionProps
  | ICalendarSingleSelectionProps
  | ICalendarMultipleSelectionProps
  | ICalendarRangeSelectionProps;

export type TCalendarSelectionMode = "none" | "single" | "multiple" | "range";

/** Внутреннее состояние выбора — только ключи дней, без dayjs-объектов. */
export type TCalendarSelectionState =
  | { mode: "none" }
  | { mode: "single"; key: TCalendarDateKey | null }
  | { mode: "multiple"; keys: readonly TCalendarDateKey[] }
  | {
      mode: "range";
      start: TCalendarDateKey | null;
      end: TCalendarDateKey | null;
    };

/** Выбор для внешнего кода: те же режимы, но уже с dayjs-объектами. */
export type TCalendarSelectionValue =
  | { mode: "none" }
  | { mode: "single"; value: Dayjs | null }
  | { mode: "multiple"; value: Dayjs[] }
  | { mode: "range"; value: ICalendarRange };

// ---------------------------------------------------------------------------
// Данные дня: маркеры / подпись / произвольный payload
// ---------------------------------------------------------------------------

export interface ICalendarMarker {
  /** Цвет точки. По умолчанию — primary темы. */
  color?: string;
  /** Ключ для React-списка; если не задан — индекс. */
  key?: string;
}

export interface ICalendarDayData<TExtra = unknown> {
  /** Точки-маркеры под числом. */
  markers?: ICalendarMarker[];
  /** Текст под числом (сумма, счётчик и т.п.). Если задан, маркеры не показываются. */
  label?: string;
  /** Точечно запретить выбор дня. */
  disabled?: boolean;
  /** Произвольные данные для кастомного рендера. */
  extra?: TExtra;
}

export type TCalendarDayDataMap<TExtra = unknown> = Readonly<
  Record<TCalendarDateKey, ICalendarDayData<TExtra>>
>;

// ---------------------------------------------------------------------------
// Сетка месяца
// ---------------------------------------------------------------------------

export interface ICalendarGridCell {
  /** Ключ дня. Называется не `key`, потому что `key` React забирает себе при спреде пропсов. */
  dateKey: TCalendarDateKey;
  /** Число месяца 1–31. */
  day: number;
  /** День недели 0–6 (по dayjs). */
  weekday: TCalendarWeekDay;
  /** Хвост соседнего месяца. */
  isOutside: boolean;
}

export interface ICalendarMonthGrid {
  key: TCalendarMonthKey;
  year: number;
  /** Месяц 0–11. */
  month: number;
  daysInMonth: number;
  /** Недели × 7 ячеек. */
  weeks: readonly (readonly ICalendarGridCell[])[];
  /** Первая и последняя ячейка сетки — вместе с хвостами. */
  fromKey: TCalendarDateKey;
  toKey: TCalendarDateKey;
}

// ---------------------------------------------------------------------------
// Пропсы составных элементов — их получают и дефолтные компоненты, и render-функции
// ---------------------------------------------------------------------------

export interface ICalendarDayState<TExtra = unknown> extends ICalendarGridCell {
  /** Dayjs этого дня в локали календаря. Экземпляр общий (из кэша), но dayjs иммутабелен. */
  date: Dayjs;
  /** Месяц сетки, в которой день отрисован. Для хвостов не совпадает с месяцем самого дня. */
  monthKey: TCalendarMonthKey;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  /** Начало периода выбрано, конец ещё нет. */
  isRangeOpen: boolean;
  /** Строго между началом и концом периода. */
  isInRange: boolean;
  data?: ICalendarDayData<TExtra>;
}

export interface ICalendarDayProps<
  TExtra = unknown,
> extends ICalendarDayState<TExtra> {
  onPress?: (key: TCalendarDateKey) => void;
  onLongPress?: (key: TCalendarDateKey) => void;
  /** В этой строке недели есть хотя бы один день с подписью или маркерами. Если нет — число ставится по центру. */
  hasRowContent: boolean;
}

/** `key` маркера уходит в React-ключ, в пропсы не попадает. */
export interface ICalendarMarkerProps extends Omit<ICalendarMarker, "key"> {
  index: number;
  count: number;
}

export interface ICalendarWeekProps<TExtra = unknown> {
  monthKey: TCalendarMonthKey;
  index: number;
  days: readonly ICalendarDayState<TExtra>[];
}

export interface ICalendarMonthProps<TExtra = unknown> {
  grid: ICalendarMonthGrid;
  /** Дни с уже посчитанными состояниями (по неделям). */
  weeks: readonly (readonly ICalendarDayState<TExtra>[])[];
  /** Заголовок месяца (показывается в списке). */
  title?: string;
}

export interface ICalendarWeekDayProps {
  weekday: TCalendarWeekDay;
  label: string;
  isWeekend: boolean;
}

export interface ICalendarWeekDaysProps {
  items: readonly ICalendarWeekDayProps[];
}

export interface ICalendarNavButtonProps {
  direction: "prev" | "next";
  disabled: boolean;
  onPress: () => void;
}

export interface ICalendarHeaderProps {
  monthKey: TCalendarMonthKey;
  month: Dayjs;
  title: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  showNavButtons: boolean;
  /** Есть, только если снаружи переданы `onHeaderTitlePress` / `onHeaderTitleLongPress`. */
  onTitlePress?: () => void;
  onTitleLongPress?: () => void;
}

// ---------------------------------------------------------------------------
// Рендер-функции всех элементов
// ---------------------------------------------------------------------------

export interface ICalendarRenderers<TExtra = unknown> {
  renderHeader?: (props: ICalendarHeaderProps) => ReactNode;
  renderHeaderTitle?: (props: ICalendarHeaderProps) => ReactNode;
  renderNavButton?: (props: ICalendarNavButtonProps) => ReactNode;
  renderWeekDays?: (props: ICalendarWeekDaysProps) => ReactNode;
  renderWeekDay?: (props: ICalendarWeekDayProps) => ReactNode;
  renderMonth?: (props: ICalendarMonthProps<TExtra>) => ReactNode;
  renderMonthTitle?: (props: ICalendarMonthProps<TExtra>) => ReactNode;
  renderWeek?: (props: ICalendarWeekProps<TExtra>) => ReactNode;
  renderDay?: (props: ICalendarDayProps<TExtra>) => ReactNode;
  /** Контент под числом. По умолчанию — подпись, а если её нет — маркеры. */
  renderDayContent?: (props: ICalendarDayProps<TExtra>) => ReactNode;
  renderMarker?: (props: ICalendarMarkerProps) => ReactNode;
}

// ---------------------------------------------------------------------------
// Форматы и стили
// ---------------------------------------------------------------------------

export type TCalendarFormat = string | ((date: Dayjs) => string);

export interface ICalendarFormats {
  /** Заголовок шапки. */
  headerTitle: TCalendarFormat;
  /** Заголовок месяца внутри списка. */
  monthTitle: TCalendarFormat;
  /** Подпись дня недели. */
  weekDay: TCalendarFormat;
  /** Число в ячейке. */
  day: TCalendarFormat;
}

export interface ICalendarStyles {
  container: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  headerTitle: StyleProp<TextStyle>;
  navButton: StyleProp<ViewStyle>;
  weekDays: StyleProp<ViewStyle>;
  weekDay: StyleProp<ViewStyle>;
  weekDayText: StyleProp<TextStyle>;
  month: StyleProp<ViewStyle>;
  monthTitle: StyleProp<TextStyle>;
  week: StyleProp<ViewStyle>;
  day: StyleProp<ViewStyle>;
  dayInner: StyleProp<ViewStyle>;
  dayText: StyleProp<TextStyle>;
  dayLabel: StyleProp<TextStyle>;
  dayMarkers: StyleProp<ViewStyle>;
  marker: StyleProp<ViewStyle>;
  dayToday: StyleProp<ViewStyle>;
  dayTodayText: StyleProp<TextStyle>;
  daySelected: StyleProp<ViewStyle>;
  daySelectedText: StyleProp<TextStyle>;
  dayOutside: StyleProp<ViewStyle>;
  dayOutsideText: StyleProp<TextStyle>;
  dayDisabled: StyleProp<ViewStyle>;
  dayDisabledText: StyleProp<TextStyle>;
  /** Полоса периода за ячейкой: половина у начала/конца, вся ячейка у дней между. */
  dayRange: StyleProp<ViewStyle>;
  /** Ячейка начала/конца периода (поверх `daySelected`). */
  dayRangeEdge: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Общая конфигурация календаря
// ---------------------------------------------------------------------------

export interface ICalendarBaseProps<
  TExtra = unknown,
> extends ICalendarRenderers<TExtra> {
  /** Локаль dayjs (`ru`, `en`, …) — её файл должен быть импортирован. По умолчанию — глобальная локаль dayjs. */
  locale?: string;
  /** Первый день недели. По умолчанию — из локали. */
  firstDayOfWeek?: TCalendarWeekDay;
  /** Что считать сегодняшним днём. По умолчанию — текущая дата. */
  today?: TCalendarDateInput;
  minDate?: TCalendarDateInput | null;
  maxDate?: TCalendarDateInput | null;
  disabledDates?: readonly TCalendarDateInput[];
  disabledWeekDays?: readonly TCalendarWeekDay[];
  isDateDisabled?: (date: Dayjs, key: TCalendarDateKey) => boolean;
  /** Показывать дни соседних месяцев (хвосты). По умолчанию — true у Calendar и false у CalendarList. */
  showOutsideDays?: boolean;
  /** Хвосты можно выбирать. По умолчанию — true. */
  selectableOutsideDays?: boolean;
  /** Тап по хвосту переводит календарь на месяц этого дня. По умолчанию — false. */
  navigateOnOutsideDayPress?: boolean;
  /** Всегда 6 строк в сетке, чтобы высота не менялась от месяца к месяцу. По умолчанию — false. */
  fixedWeeks?: boolean;
  showHeader?: boolean;
  showWeekDays?: boolean;
  showNavButtons?: boolean;
  formats?: Partial<ICalendarFormats>;
  styles?: Partial<ICalendarStyles>;
  /** Высота строки-недели, px. */
  dayHeight?: number;
  /** Зазор между строками-неделями, px. */
  weekGap?: number;
  /** Данные дней по ключу `YYYY-MM-DD`. */
  dayData?: TCalendarDayDataMap<TExtra>;
  /** Альтернатива `dayData` — данные считаются по запросу. Если ключ есть в `dayData`, берётся он. */
  getDayData?: (
    date: Dayjs,
    key: TCalendarDateKey,
  ) => ICalendarDayData<TExtra> | undefined;
  /** Тап по доступному дню. `day` описывает состояние до применения выбора. */
  onDayPress?: (day: ICalendarDayState<TExtra>) => void;
  onDayLongPress?: (day: ICalendarDayState<TExtra>) => void;
  /** Смена текущего (видимого) месяца. */
  onMonthChange?: (month: Dayjs, key: TCalendarMonthKey) => void;
  /** Тап по названию месяца в шапке. */
  onHeaderTitlePress?: (month: Dayjs, key: TCalendarMonthKey) => void;
  onHeaderTitleLongPress?: (month: Dayjs, key: TCalendarMonthKey) => void;
}

/** Конфигурация после применения дефолтов — то, что лежит в контексте. */
export interface ICalendarResolvedConfig<
  TExtra = unknown,
> extends ICalendarRenderers<TExtra> {
  locale: string;
  firstDayOfWeek: TCalendarWeekDay;
  todayKey: TCalendarDateKey;
  minKey: TCalendarDateKey | null;
  maxKey: TCalendarDateKey | null;
  showOutsideDays: boolean;
  selectableOutsideDays: boolean;
  navigateOnOutsideDayPress: boolean;
  fixedWeeks: boolean;
  showHeader: boolean;
  showWeekDays: boolean;
  showNavButtons: boolean;
  formats: ICalendarFormats;
  styles: Partial<ICalendarStyles>;
  dayHeight: number;
  weekGap: number;
  /** Доступен ли день для выбора с учётом всех правил. */
  isDayDisabled: (cell: ICalendarGridCell) => boolean;
  /** Данные дня из `dayData`, а если там нет — из `getDayData`. */
  resolveDayData: (
    key: TCalendarDateKey,
  ) => ICalendarDayData<TExtra> | undefined;
  onHeaderTitlePress?: (month: Dayjs, key: TCalendarMonthKey) => void;
  onHeaderTitleLongPress?: (month: Dayjs, key: TCalendarMonthKey) => void;
}

export interface ICalendarState {
  selection: TCalendarSelectionState;
  /** Текущий (для Calendar) или видимый (для CalendarList) месяц. */
  monthKey: TCalendarMonthKey;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export interface ICalendarActions {
  pressDay: (key: TCalendarDateKey) => void;
  longPressDay: (key: TCalendarDateKey) => void;
  goToMonth: (month: TCalendarDateInput, animated?: boolean) => void;
  goToNextMonth: (animated?: boolean) => void;
  goToPrevMonth: (animated?: boolean) => void;
  goToToday: (animated?: boolean) => void;
  /** Список сообщает, какой месяц сейчас виден, — без прокрутки. */
  syncMonth: (monthKey: TCalendarMonthKey) => void;
  /** Вью (слайдер или список) регистрирует, как физически перейти к месяцу. */
  registerNavigator: (navigator: ICalendarNavigator | null) => void;
}

/** Как конкретная вью переходит к месяцу: слайдер — анимацией, список — скроллом. */
export interface ICalendarNavigator {
  goToMonth: (monthKey: TCalendarMonthKey, animated: boolean) => void;
}

// ---------------------------------------------------------------------------
// Ref
// ---------------------------------------------------------------------------

export interface ICalendarRef {
  goToMonth: (month: TCalendarDateInput, animated?: boolean) => void;
  goToNextMonth: (animated?: boolean) => void;
  goToPrevMonth: (animated?: boolean) => void;
  goToToday: (animated?: boolean) => void;
  /** Текущий/видимый месяц. */
  getMonth: () => Dayjs;
  /** То же, что тап по дню: применяет правила режима, недоступные дни игнорирует. */
  select: (date: TCalendarDateInput) => void;
  setSelection: (value: TCalendarSelectionValue) => void;
  clearSelection: () => void;
  getSelection: () => TCalendarSelectionValue;
}

// ---------------------------------------------------------------------------
// Пропсы компонентов
// ---------------------------------------------------------------------------

interface ICalendarViewProps<
  TExtra = unknown,
> extends ICalendarBaseProps<TExtra> {
  /** Стартовый месяц. По умолчанию — выбранная дата или сегодня. */
  initialMonth?: TCalendarDateInput;
  /** Контролируемый месяц. */
  month?: TCalendarDateInput;
  style?: StyleProp<ViewStyle>;
}

export interface ICalendarOwnProps<
  TExtra = unknown,
> extends ICalendarViewProps<TExtra> {
  /** Слайд при смене месяца. По умолчанию — true. */
  animated?: boolean;
  /** Длительность слайда, мс. */
  animationDuration?: number;
  /** Свайпы влево/вправо переключают месяц. Работает только вместе с `animated`. По умолчанию — true. */
  gestureEnabled?: boolean;
}

export type TCalendarProps<TExtra = unknown> = ICalendarOwnProps<TExtra> &
  TCalendarSelectionProps;

export interface ICalendarListOwnProps<
  TExtra = unknown,
> extends ICalendarViewProps<TExtra> {
  /** Месяцев назад от `initialMonth` (если не задан `minDate`). */
  pastMonths?: number;
  /** Месяцев вперёд от `initialMonth` (если не задан `maxDate`). */
  futureMonths?: number;
  /** Заголовок над каждым месяцем. По умолчанию — true. */
  showMonthTitles?: boolean;
  /** Высота заголовка месяца, px. Нужна списку для точного расчёта позиций. */
  monthTitleHeight?: number;
  /** Отступ между месяцами, px. */
  monthGap?: number;
  /** Своя высота месяца (без `monthGap`), если `renderMonth` рисует его иначе. */
  getMonthHeight?: (grid: ICalendarMonthGrid) => number;
  /** Смена видимого месяца при скролле (в дополнение к onMonthChange). */
  onVisibleMonthChange?: (month: Dayjs, key: TCalendarMonthKey) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  scrollEnabled?: boolean;
  /** Сколько процентов месяца должно быть видно, чтобы он считался текущим. Читается один раз при монтировании. */
  visibleMonthThreshold?: number;
}

export type TCalendarListProps<TExtra = unknown> =
  ICalendarListOwnProps<TExtra> & TCalendarSelectionProps;
