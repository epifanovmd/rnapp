import { useRef } from "react";

import type { ICalendarRef } from "../calendar.types";

/** Ref для управления календарём: `const calendar = useCalendarRef(); <Calendar ref={calendar} />`. */
export const useCalendarRef = () => useRef<ICalendarRef>(null);
