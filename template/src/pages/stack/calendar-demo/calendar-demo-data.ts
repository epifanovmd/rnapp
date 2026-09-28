import type { TCalendarDayDataMap } from "@shared/ui";
import dayjs from "dayjs";

const MARKER_COLORS = ["#2965FF", "#B0246E", "#35B645", "#E49E22"];

const key = (day: number, month = dayjs()) =>
  month.date(day).format("YYYY-MM-DD");

/** Демо-данные текущего месяца: подписи-суммы и маркеры, как на макете. */
export const buildDemoDayData = (): TCalendarDayDataMap => {
  const now = dayjs();
  const markers = (count: number) =>
    MARKER_COLORS.slice(0, count).map(color => ({ color }));

  return {
    [key(5, now)]: { label: "1 000", markers: markers(2) },
    [key(10, now)]: { label: "768", markers: markers(2) },
    [key(11, now)]: { label: "364", markers: markers(2) },
    [key(12, now)]: { label: "364 364", markers: markers(2) },
    [key(16, now)]: { label: "364 364", markers: markers(2) },
    [key(19, now)]: { label: "812", markers: markers(4) },
    [key(22, now)]: { label: "4,51M", markers: markers(2) },
    [key(24, now)]: { label: "4,51M", markers: markers(2) },
    [key(25, now)]: { label: "43,8M", markers: markers(2) },
    [key(26, now)]: { label: "123 300", markers: markers(2) },
    [key(29, now)]: { label: "1,51M", markers: markers(2) },
  };
};

/** Те же дни, но только маркеры (без подписи подпись не перекрывает точки). */
export const stripLabels = (data: TCalendarDayDataMap): TCalendarDayDataMap =>
  Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, { ...v, label: undefined }]),
  );
