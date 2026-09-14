import React, { FC, memo } from "react";

import type { TCalendarMonthKey } from "../calendar.types";
import { useCalendarConfig, useCalendarMonthDays } from "../context";
import { formatDate, monthKeyToDayjs } from "../model";
import { CalendarMonth } from "./CalendarMonth";

export interface ICalendarMonthConnectedProps {
  monthKey: TCalendarMonthKey;
  /** Рисовать заголовок месяца — нужно в списке. */
  withTitle?: boolean;
}

/** Месяц, подключённый к контексту: считает состояния дней и отдаёт их `renderMonth` или `CalendarMonth`. */
export const CalendarMonthConnected: FC<ICalendarMonthConnectedProps> = memo(
  ({ monthKey, withTitle }) => {
    const { renderMonth, formats, locale } = useCalendarConfig();
    const { grid, weeks } = useCalendarMonthDays(monthKey);

    const title = withTitle
      ? formatDate(monthKeyToDayjs(monthKey, locale), formats.monthTitle)
      : undefined;
    const props = { grid, weeks, title };

    return (
      <>{renderMonth ? renderMonth(props) : <CalendarMonth {...props} />}</>
    );
  },
);
