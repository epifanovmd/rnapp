import React, { FC, memo } from "react";

import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarState,
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
  const { monthKey, canGoPrev, canGoNext } = useCalendarState();
  const { goToPrevMonth, goToNextMonth } = useCalendarActions();

  const month = monthKeyToDayjs(monthKey, locale);
  const props = {
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

  return (
    <>{renderHeader ? renderHeader(props) : <CalendarHeader {...props} />}</>
  );
});
