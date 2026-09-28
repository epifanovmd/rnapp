import React, { FC, memo, useMemo } from "react";

import type { ICalendarHeaderProps } from "../calendar.types";
import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarMonthState,
} from "../context";
import { formatDate, monthKeyToDayjs } from "../model";
import { CalendarHeader } from "./CalendarHeader";

/** Шапка, подключённая к контексту: знает текущий месяц и умеет его переключать. */
export const CalendarHeaderConnected: FC = memo(() => {
  const {
    locale,
    formats,
    showNavButtons,
    renderHeader,
    onHeaderTitlePress,
    onHeaderTitleLongPress,
  } = useCalendarConfig();
  const { monthKey, canGoPrev, canGoNext } = useCalendarMonthState();
  const { goToPrevMonth, goToNextMonth } = useCalendarActions();

  // Пропсы собираются один раз на месяц: иначе новые замыкания ломали бы memo шапки и кнопок.
  const props = useMemo<ICalendarHeaderProps>(() => {
    const month = monthKeyToDayjs(monthKey, locale);

    return {
      monthKey,
      month,
      title: formatDate(month, formats.headerTitle),
      canGoPrev,
      canGoNext,
      onPrev: () => goToPrevMonth(),
      onNext: () => goToNextMonth(),
      showNavButtons,
      onTitlePress: onHeaderTitlePress
        ? () => onHeaderTitlePress(month, monthKey)
        : undefined,
      onTitleLongPress: onHeaderTitleLongPress
        ? () => onHeaderTitleLongPress(month, monthKey)
        : undefined,
    };
  }, [
    monthKey,
    locale,
    formats.headerTitle,
    canGoPrev,
    canGoNext,
    goToPrevMonth,
    goToNextMonth,
    showNavButtons,
    onHeaderTitlePress,
    onHeaderTitleLongPress,
  ]);

  return (
    <>{renderHeader ? renderHeader(props) : <CalendarHeader {...props} />}</>
  );
});
