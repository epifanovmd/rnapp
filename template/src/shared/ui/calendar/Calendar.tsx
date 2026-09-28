import React, { forwardRef, ReactElement, Ref } from "react";

import type { ICalendarRef, TCalendarProps } from "./calendar.types";
import { CalendarProvider } from "./context";
import { CalendarView } from "./ui";

const CalendarImpl = <TExtra,>(
  props: TCalendarProps<TExtra>,
  ref: Ref<ICalendarRef>,
) => (
  <CalendarProvider<TExtra> ref={ref} {...props}>
    <CalendarView
      style={props.style}
      animated={props.animated}
      animationDuration={props.animationDuration}
      gestureEnabled={props.gestureEnabled}
    />
  </CalendarProvider>
);

/**
 * Одиночный календарь: шапка, дни недели и один месяц. Между месяцами —
 * кнопки шапки, свайп или ref.
 */
export const Calendar = forwardRef(CalendarImpl) as <TExtra = unknown>(
  props: TCalendarProps<TExtra> & { ref?: Ref<ICalendarRef> },
) => ReactElement;
