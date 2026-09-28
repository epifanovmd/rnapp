import { setDefaultOptions } from "date-fns";
import { enUS, ru } from "date-fns/locale";

import {
  DEFAULT_FORMATS,
  formatDate,
  getWeekDayLabels,
  globalLocale,
  localeFirstDayOfWeek,
  orderedWeekDays,
} from "../calendar-formats";

describe("calendar-formats", () => {
  it("orderedWeekDays с понедельника и с воскресенья", () => {
    expect(orderedWeekDays(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(orderedWeekDays(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("подписи дней недели в локали ru и кэш", () => {
    const items = getWeekDayLabels(ru, 1, "EEEEEE");

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
    expect(getWeekDayLabels(ru, 1, "EEEEEE")).toBe(items);
  });

  it("формат-функция и первый день недели локали", () => {
    expect(formatDate(new Date(2026, 8, 14), d => `#${d.getDate()}`, ru)).toBe(
      "#14",
    );
    expect(localeFirstDayOfWeek(ru)).toBe(1);
    expect(localeFirstDayOfWeek(enUS)).toBe(0);
  });

  it("заголовок месяца — именительный падеж, число — без нуля", () => {
    const date = new Date(2026, 8, 5);

    expect(formatDate(date, DEFAULT_FORMATS.headerTitle, ru)).toBe(
      "сентябрь 2026",
    );
    expect(formatDate(date, DEFAULT_FORMATS.day, ru)).toBe("5");
  });

  it("локаль по умолчанию — из setDefaultOptions, иначе en-US", () => {
    expect(globalLocale()).toBe(enUS);

    setDefaultOptions({ locale: ru });
    expect(globalLocale()).toBe(ru);

    setDefaultOptions({ locale: undefined });
  });
});
