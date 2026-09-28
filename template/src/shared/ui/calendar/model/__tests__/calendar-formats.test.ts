import "dayjs/locale/ru";

import dayjs from "dayjs";

import {
  formatDate,
  getWeekDayLabels,
  localeFirstDayOfWeek,
  orderedWeekDays,
} from "../calendar-formats";

describe("calendar-formats", () => {
  it("orderedWeekDays с понедельника и с воскресенья", () => {
    expect(orderedWeekDays(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(orderedWeekDays(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("подписи дней недели в локали ru и кэш", () => {
    const items = getWeekDayLabels("ru", 1, "dd");

    expect(items.map(i => i.label)).toEqual([
      "пн",
      "вт",
      "ср",
      "чт",
      "пт",
      "сб",
      "вс",
    ]);
    expect(items[5]!.isWeekend).toBe(true);
    expect(getWeekDayLabels("ru", 1, "dd")).toBe(items);
  });

  it("формат-функция и первый день недели локали", () => {
    expect(formatDate(dayjs("2026-09-14"), d => `#${d.date()}`)).toBe("#14");
    expect(localeFirstDayOfWeek("ru")).toBe(1);
    expect(localeFirstDayOfWeek("en")).toBe(0);
  });
});
