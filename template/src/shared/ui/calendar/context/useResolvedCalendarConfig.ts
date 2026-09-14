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
export const useResolvedCalendarConfig = <TExtra>(
  props: ICalendarBaseProps<TExtra>,
  defaults: Partial<Pick<ICalendarBaseProps, "showOutsideDays">> = {},
): ICalendarResolvedConfig<TExtra> => {
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
  const firstDayOfWeek = firstDayOfWeekProp ?? localeFirstDayOfWeek(locale);
  const todayKey = toDateKey(today) ?? toDateKey(new Date())!;
  const minKey = toDateKey(minDate);
  const maxKey = toDateKey(maxDate);

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

  const resolveDayData = useMemo(
    () =>
      (key: TCalendarDateKey): ICalendarDayData<TExtra> | undefined =>
        dayData?.[key] ?? getDayData?.(keyToDayjs(key, locale), key),
    [dayData, getDayData, locale],
  );

  return useStableValue<ICalendarResolvedConfig<TExtra>>({
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
