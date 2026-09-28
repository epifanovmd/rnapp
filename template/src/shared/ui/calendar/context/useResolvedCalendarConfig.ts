import { useStableValue } from "@shared/lib/hooks";
import { useMemo } from "react";

import type {
  ICalendarBaseProps,
  ICalendarDayData,
  ICalendarGridCell,
  ICalendarResolvedConfig,
  TCalendarDateKey,
} from "../calendar.types";
import {
  DEFAULT_FORMATS,
  globalLocale,
  IAvailabilityRules,
  isDayDisabled,
  keyToDayjs,
  localeFirstDayOfWeek,
  toDateKey,
} from "../model";

export const DEFAULT_DAY_HEIGHT = 56;
export const DEFAULT_WEEK_GAP = 2;

const EMPTY_STYLES = {};

/**
 * Пропсы → конфиг с дефолтами и готовыми функциями проверки. Ссылка на конфиг
 * меняется только когда меняется хоть одно значение — от неё зависят все месяцы.
 */
export type TResolvedCalendarConfig<TExtra> = Omit<
  ICalendarResolvedConfig<TExtra>,
  "initialMonthKey" | "monthBounds"
>;

export const useResolvedCalendarConfig = <TExtra>(
  props: ICalendarBaseProps<TExtra>,
  defaults: Partial<Pick<ICalendarBaseProps, "showOutsideDays">> = {},
): TResolvedCalendarConfig<TExtra> => {
  const {
    locale: localeProp,
    firstDayOfWeek: firstDayOfWeekProp,
    today,
    minDate,
    maxDate,
    disabledDates,
    disabledWeekDays,
    isDateDisabled,
    showOutsideDays = defaults.showOutsideDays ?? true,
    selectableOutsideDays = true,
    navigateOnOutsideDayPress = false,
    fixedWeeks = false,
    showHeader = true,
    showWeekDays = true,
    showNavButtons = true,
    formats: formatsProp,
    styles: stylesProp,
    dayHeight = DEFAULT_DAY_HEIGHT,
    weekGap = DEFAULT_WEEK_GAP,
    dayData,
    getDayData,
    renderHeader,
    renderHeaderTitle,
    renderNavButton,
    renderWeekDays,
    renderWeekDay,
    renderMonth,
    renderMonthTitle,
    renderWeek,
    renderDay,
    renderDayContent,
    renderMarker,
    onHeaderTitlePress,
    onHeaderTitleLongPress,
  } = props;

  const locale = localeProp ?? globalLocale();
  // Разбор дат и локали — через dayjs; провайдер рендерится на каждый тап, поэтому считаем только по смене входов.
  const firstDayOfWeek = useMemo(
    () => firstDayOfWeekProp ?? localeFirstDayOfWeek(locale),
    [firstDayOfWeekProp, locale],
  );
  const todayKey = useMemo(
    () => toDateKey(today) ?? toDateKey(new Date())!,
    [today],
  );
  const minKey = useMemo(() => toDateKey(minDate), [minDate]);
  const maxKey = useMemo(() => toDateKey(maxDate), [maxDate]);

  const formats = useStableValue({ ...DEFAULT_FORMATS, ...formatsProp });
  const styles = useStableValue(stylesProp ?? EMPTY_STYLES);

  const disabledKeys = useMemo(
    () =>
      new Set(
        (disabledDates ?? [])
          .map(toDateKey)
          .filter((k): k is TCalendarDateKey => k !== null),
      ),
    [disabledDates],
  );
  const disabledWeekDaysSet = useMemo(
    () => new Set(disabledWeekDays ?? []),
    [disabledWeekDays],
  );

  const isDayDisabledFn = useMemo(() => {
    const rules: IAvailabilityRules = {
      minKey,
      maxKey,
      disabledKeys,
      disabledWeekDays: disabledWeekDaysSet,
      disableOutside: !selectableOutsideDays,
      isDateDisabled,
      resolveDayjs: key => keyToDayjs(key, locale),
    };

    return (cell: ICalendarGridCell) => isDayDisabled(cell, rules);
  }, [
    minKey,
    maxKey,
    disabledKeys,
    disabledWeekDaysSet,
    selectableOutsideDays,
    isDateDisabled,
    locale,
  ]);

  const resolveDayData = useMemo(() => {
    if (!getDayData) {
      return (key: TCalendarDateKey) => dayData?.[key];
    }
    // Результат `getDayData` запоминается по ключу: новый объект на каждый вызов ломал бы memo ячеек.
    const cache = new Map<
      TCalendarDateKey,
      ICalendarDayData<TExtra> | undefined
    >();

    return (key: TCalendarDateKey): ICalendarDayData<TExtra> | undefined => {
      if (cache.has(key)) return cache.get(key);

      const data = dayData?.[key] ?? getDayData(keyToDayjs(key, locale), key);

      cache.set(key, data);

      return data;
    };
  }, [dayData, getDayData, locale]);

  return useStableValue<TResolvedCalendarConfig<TExtra>>({
    locale,
    firstDayOfWeek,
    todayKey,
    minKey,
    maxKey,
    showOutsideDays,
    selectableOutsideDays,
    navigateOnOutsideDayPress,
    fixedWeeks,
    showHeader,
    showWeekDays,
    showNavButtons,
    formats,
    styles,
    dayHeight,
    weekGap,
    isDayDisabled: isDayDisabledFn,
    resolveDayData,
    renderHeader,
    renderHeaderTitle,
    renderNavButton,
    renderWeekDays,
    renderWeekDay,
    renderMonth,
    renderMonthTitle,
    renderWeek,
    renderDay,
    renderDayContent,
    renderMarker,
    onHeaderTitlePress,
    onHeaderTitleLongPress,
  });
};
