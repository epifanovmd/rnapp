import dayjs from "dayjs";

import { IAvailabilityRules, isDayDisabled } from "../availability";

const rules = (over: Partial<IAvailabilityRules> = {}): IAvailabilityRules => ({
  minKey: null,
  maxKey: null,
  disabledKeys: new Set(),
  disabledWeekDays: new Set(),
  disableOutside: true,
  resolveDayjs: key => dayjs(key),
  ...over,
});

const cell = (key: string, weekday: number, isOutside = false) => ({
  dateKey: key,
  day: Number(key.slice(8)),
  weekday: weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  isOutside,
});

describe("availability", () => {
  it("min/max включительно", () => {
    const r = rules({ minKey: "2026-09-05", maxKey: "2026-09-20" });

    expect(isDayDisabled(cell("2026-09-04", 5), r)).toBe(true);
    expect(isDayDisabled(cell("2026-09-05", 6), r)).toBe(false);
    expect(isDayDisabled(cell("2026-09-20", 0), r)).toBe(false);
    expect(isDayDisabled(cell("2026-09-21", 1), r)).toBe(true);
  });

  it("хвосты, дни недели, точечные даты", () => {
    expect(isDayDisabled(cell("2026-08-31", 1, true), rules())).toBe(true);
    expect(
      isDayDisabled(
        cell("2026-08-31", 1, true),
        rules({ disableOutside: false }),
      ),
    ).toBe(false);
    expect(
      isDayDisabled(
        cell("2026-09-06", 0),
        rules({ disabledWeekDays: new Set([0, 6]) }),
      ),
    ).toBe(true);
    expect(
      isDayDisabled(
        cell("2026-09-07", 1),
        rules({ disabledKeys: new Set(["2026-09-07"]) }),
      ),
    ).toBe(true);
  });

  it("пользовательский предикат вызывается последним и получает dayjs", () => {
    const isDateDisabled = jest.fn((d: dayjs.Dayjs) => d.date() === 13);
    const r = rules({ minKey: "2026-09-10", isDateDisabled });

    expect(isDayDisabled(cell("2026-09-01", 2), r)).toBe(true);
    expect(isDateDisabled).not.toHaveBeenCalled();
    expect(isDayDisabled(cell("2026-09-13", 0), r)).toBe(true);
    expect(isDayDisabled(cell("2026-09-14", 1), r)).toBe(false);
  });
});
