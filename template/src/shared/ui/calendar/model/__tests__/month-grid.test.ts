import { computeMonthGrid, getMonthGrid } from "../month-grid";

describe("month-grid", () => {
  it("сентябрь 2026 с понедельника: 5 недель, хвосты августа и октября", () => {
    const grid = computeMonthGrid("2026-09", {
      firstDayOfWeek: 1,
      fixedWeeks: false,
    });

    expect(grid.daysInMonth).toBe(30);
    expect(grid.weeks).toHaveLength(5);
    expect(grid.weeks[0]![0]).toEqual({
      dateKey: "2026-08-31",
      day: 31,
      weekday: 1,
      isOutside: true,
    });
    expect(grid.weeks[0]![1]).toMatchObject({
      dateKey: "2026-09-01",
      isOutside: false,
    });
    expect(grid.weeks[4]![6]).toMatchObject({
      dateKey: "2026-10-04",
      isOutside: true,
    });
    expect(grid.fromKey).toBe("2026-08-31");
    expect(grid.toKey).toBe("2026-10-04");
  });

  it("с воскресенья первая ячейка — воскресенье", () => {
    const grid = computeMonthGrid("2026-09", {
      firstDayOfWeek: 0,
      fixedWeeks: false,
    });

    expect(grid.weeks[0]![0]!.dateKey).toBe("2026-08-30");
    expect(grid.weeks[0]![0]!.weekday).toBe(0);
  });

  it("fixedWeeks всегда даёт 6 недель", () => {
    const grid = computeMonthGrid("2026-02", {
      firstDayOfWeek: 1,
      fixedWeeks: true,
    });

    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks.every(w => w.length === 7)).toBe(true);
  });

  it("февраль 2021 с понедельника без fixedWeeks — ровно 4 недели", () => {
    const grid = computeMonthGrid("2021-02", {
      firstDayOfWeek: 1,
      fixedWeeks: false,
    });

    expect(grid.weeks).toHaveLength(4);
    expect(grid.weeks.flat().some(c => c.isOutside)).toBe(false);
  });

  it("getMonthGrid возвращает кэшированный объект", () => {
    const opts = { firstDayOfWeek: 1 as const, fixedWeeks: false };

    expect(getMonthGrid("2026-03", opts)).toBe(getMonthGrid("2026-03", opts));
    expect(getMonthGrid("2026-03", opts)).not.toBe(
      getMonthGrid("2026-03", { ...opts, fixedWeeks: true }),
    );
  });
});
