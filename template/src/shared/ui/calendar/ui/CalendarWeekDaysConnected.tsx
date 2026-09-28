import React, { FC, memo } from "react";

import { useCalendarConfig } from "../context";
import { getWeekDayLabels } from "../model";
import { CalendarWeekDays } from "./CalendarWeekDays";

/** Названия дней недели по локали, первому дню недели и формату из конфига. */
export const CalendarWeekDaysConnected: FC = memo(() => {
  const { locale, firstDayOfWeek, formats, renderWeekDays } =
    useCalendarConfig();
  const items = getWeekDayLabels(locale, firstDayOfWeek, formats.weekDay);

  return (
    <>
      {renderWeekDays ? (
        renderWeekDays({ items })
      ) : (
        <CalendarWeekDays items={items} />
      )}
    </>
  );
});
