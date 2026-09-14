import {
  buildMonthKeys,
  monthIndexOf,
  resolveMonthBounds,
} from "../month-range";

describe("month-range", () => {
  it("границы из past/future вокруг стартового месяца", () => {
    expect(
      resolveMonthBounds({
        initialMonth: "2026-09",
        minMonth: null,
        maxMonth: null,
        pastMonths: 2,
        futureMonths: 3,
      }),
    ).toEqual({ from: "2026-07", to: "2026-12" });
  });

  it("min/max приоритетнее past/future, стартовый месяц зажимается", () => {
    expect(
      resolveMonthBounds({
        initialMonth: "2020-01",
        minMonth: "2026-01",
        maxMonth: "2026-06",
        pastMonths: 12,
        futureMonths: 12,
      }),
    ).toEqual({ from: "2026-01", to: "2026-06" });
  });

  it("buildMonthKeys и monthIndexOf согласованы", () => {
    const keys = buildMonthKeys("2025-11", "2026-02");

    expect(keys).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(monthIndexOf("2025-11", "2026-02", "2026-01")).toBe(2);
    expect(monthIndexOf("2025-11", "2026-02", "2026-03")).toBe(-1);
  });
});
