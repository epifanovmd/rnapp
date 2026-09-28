import {
  addMonths,
  clampMonthKey,
  diffMonths,
  keyToDayjs,
  makeDateKey,
  parseMonthKey,
  toDateKey,
  toMonthKey,
} from "../date-key";

describe("date-key", () => {
  it("toDateKey: разные входы → YYYY-MM-DD, невалидное → null", () => {
    expect(toDateKey("2026-09-14")).toBe("2026-09-14");
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(null)).toBeNull();
    expect(toDateKey(undefined)).toBeNull();
    expect(toDateKey("")).toBeNull();
    expect(toDateKey("not-a-date")).toBeNull();
  });

  it("toMonthKey / parseMonthKey / makeDateKey", () => {
    expect(toMonthKey("2026-09-14")).toBe("2026-09");
    expect(parseMonthKey("2026-09")).toEqual({ year: 2026, month: 8 });
    expect(makeDateKey(2026, 0, 3)).toBe("2026-01-03");
  });

  it("addMonths переходит через год в обе стороны", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-01", -13)).toBe("2024-12");
    expect(addMonths("2026-05", 0)).toBe("2026-05");
  });

  it("diffMonths со знаком", () => {
    expect(diffMonths("2026-01", "2026-04")).toBe(3);
    expect(diffMonths("2026-04", "2025-12")).toBe(-4);
  });

  it("clampMonthKey", () => {
    expect(clampMonthKey("2026-01", "2026-03", null)).toBe("2026-03");
    expect(clampMonthKey("2026-09", null, "2026-06")).toBe("2026-06");
    expect(clampMonthKey("2026-05", "2026-03", "2026-06")).toBe("2026-05");
  });

  it("keyToDayjs кэширует экземпляр по (locale, key)", () => {
    const a = keyToDayjs("2026-09-14", "en");
    const b = keyToDayjs("2026-09-14", "en");

    expect(a).toBe(b);
    expect(a.date()).toBe(14);
    expect(a.month()).toBe(8);
  });
});
