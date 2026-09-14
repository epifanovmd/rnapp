import type {
  ICalendarDayProps,
  ICalendarRange,
  TCalendarSelectionMode,
} from "@shared/ui";
import dayjs, { Dayjs } from "dayjs";
import { ReactNode, useCallback, useMemo, useState } from "react";

import { buildDemoDayData, stripLabels } from "./calendar-demo-data";

export interface ICalendarDemoToggles {
  showHeader: boolean;
  showWeekDays: boolean;
  showNavButtons: boolean;
  showOutsideDays: boolean;
  withLabels: boolean;
  customDay: boolean;
  limitDates: boolean;
  animated: boolean;
  gestures: boolean;
  monthTitles: boolean;
}

export const DEMO_TOGGLES: {
  key: keyof ICalendarDemoToggles;
  title: string;
}[] = [
  { key: "showHeader", title: "Шапка" },
  { key: "showWeekDays", title: "Дни недели" },
  { key: "showNavButtons", title: "Кнопки ←/→" },
  { key: "showOutsideDays", title: "Хвосты месяцев" },
  { key: "withLabels", title: "Подписи вместо маркеров" },
  { key: "customDay", title: "Кастомный день (13-е)" },
  { key: "limitDates", title: "min/max дата" },
  { key: "animated", title: "Анимация смены месяца" },
  { key: "gestures", title: "Свайп между месяцами" },
  { key: "monthTitles", title: "Заголовки месяцев (список)" },
];

export const DEMO_MODES: { mode: TCalendarSelectionMode; title: string }[] = [
  { mode: "single", title: "Один день" },
  { mode: "multiple", title: "Несколько" },
  { mode: "range", title: "Период" },
];

const logHeaderPress = (month: Dayjs) =>
  console.log("header press", month.format("MMMM YYYY"));
const logHeaderLongPress = (month: Dayjs) =>
  console.log("header long press", month.format("MMMM YYYY"));

const DAY_FORMAT = "DD.MM.YYYY";
const fmt = (d: Dayjs | null) => (d ? d.format(DAY_FORMAT) : "—");

/**
 * Состояние настроек демо + готовые пропсы календаря. Один хук на экран,
 * чтобы Calendar и CalendarList демонстрировались одинаково.
 */
export const useCalendarDemoSettings = (
  renderCustomDay: (props: ICalendarDayProps) => ReactNode,
  initialToggles: Partial<ICalendarDemoToggles> = {},
) => {
  const [mode, setMode] = useState<TCalendarSelectionMode>("range");
  const [toggles, setToggles] = useState<ICalendarDemoToggles>({
    showHeader: true,
    showWeekDays: true,
    showNavButtons: true,
    showOutsideDays: true,
    withLabels: true,
    customDay: false,
    limitDates: false,
    animated: true,
    gestures: true,
    monthTitles: true,
    ...initialToggles,
  });

  const setToggle = useCallback(
    (key: keyof ICalendarDemoToggles, value: boolean) =>
      setToggles(prev => ({ ...prev, [key]: value })),
    [],
  );

  const [single, setSingle] = useState<Dayjs | null>(null);
  const [multiple, setMultiple] = useState<Dayjs[]>([]);
  const [range, setRange] = useState<ICalendarRange>({
    start: null,
    end: null,
  });

  const fullData = useMemo(buildDemoDayData, []);
  const dayData = useMemo(
    () => (toggles.withLabels ? fullData : stripLabels(fullData)),
    [fullData, toggles.withLabels],
  );

  const selectionProps = useMemo(() => {
    switch (mode) {
      case "single":
        return {
          mode,
          value: single,
          onChange: setSingle,
          allowDeselect: true,
        } as const;
      case "multiple":
        return { mode, value: multiple, onChange: setMultiple } as const;
      case "range":
        return { mode, value: range, onChange: setRange } as const;
      default:
        return { mode: "none" } as const;
    }
  }, [mode, multiple, range, single]);

  const selectionText = useMemo(() => {
    switch (mode) {
      case "single":
        return fmt(single);
      case "multiple":
        return multiple.length ? multiple.map(fmt).join(", ") : "—";
      case "range":
        return `${fmt(range.start)} → ${fmt(range.end)}`;
      default:
        return "";
    }
  }, [mode, multiple, range, single]);

  const calendarProps = {
    locale: "ru",
    dayData,
    minDate: toggles.limitDates
      ? dayjs().startOf("month").add(3, "day")
      : undefined,
    maxDate: toggles.limitDates
      ? dayjs().add(2, "month").endOf("month")
      : undefined,
    showHeader: toggles.showHeader,
    showWeekDays: toggles.showWeekDays,
    showNavButtons: toggles.showNavButtons,
    showOutsideDays: toggles.showOutsideDays,
    renderDay: toggles.customDay ? renderCustomDay : undefined,
    onHeaderTitlePress: logHeaderPress,
    onHeaderTitleLongPress: logHeaderLongPress,
    ...selectionProps,
  };

  return {
    mode,
    setMode,
    toggles,
    setToggle,
    calendarProps,
    selectionText,
    /** Только для Calendar — у списка анимации смены месяца нет. */
    animated: toggles.animated,
    gestureEnabled: toggles.gestures,
    /** Только для CalendarList. */
    showMonthTitles: toggles.monthTitles,
  };
};

export type TCalendarDemoSettings = ReturnType<typeof useCalendarDemoSettings>;
