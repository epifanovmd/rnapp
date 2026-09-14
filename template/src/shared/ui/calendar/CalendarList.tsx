import React, { forwardRef, ReactElement, Ref } from "react";

import type { ICalendarRef, TCalendarListProps } from "./calendar.types";
import { CalendarProvider } from "./context";
import { CalendarListView } from "./ui";

/** Список показывает месяцы подряд — хвосты только дублировали бы соседние дни. */
const LIST_DEFAULTS = { showOutsideDays: false };

const CalendarListImpl = <TExtra,>(
  props: TCalendarListProps<TExtra>,
  ref: Ref<ICalendarRef>,
) => (
  <CalendarProvider<TExtra> ref={ref} defaults={LIST_DEFAULTS} {...props}>
    <CalendarListView {...props} />
  </CalendarProvider>
);

/**
 * Вертикальный список месяцев на FlatList. Высоты месяцев известны заранее
 * (из сетки), поэтому стартовая позиция и `goToMonth` попадают точно.
 */
export const CalendarList = forwardRef(CalendarListImpl) as <TExtra = unknown>(
  props: TCalendarListProps<TExtra> & { ref?: Ref<ICalendarRef> },
) => ReactElement;
