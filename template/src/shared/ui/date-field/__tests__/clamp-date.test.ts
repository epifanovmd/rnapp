import { clampDate } from "../clamp-date";

const min = new Date(2026, 0, 10);
const max = new Date(2026, 0, 20);

describe("clampDate", () => {
  it("дата внутри диапазона не меняется", () => {
    const date = new Date(2026, 0, 15);

    expect(clampDate(date, min, max)).toBe(date);
  });

  it("раньше min — поднимается до min", () => {
    expect(clampDate(new Date(2026, 0, 1), min, max)).toEqual(min);
  });

  it("позже max — опускается до max", () => {
    expect(clampDate(new Date(2026, 1, 1), min, max)).toEqual(max);
  });

  it("без границ дата не меняется", () => {
    const date = new Date(2000, 5, 1);

    expect(clampDate(date)).toBe(date);
  });

  it("возвращает копию границы, а не саму границу", () => {
    expect(clampDate(new Date(2026, 0, 1), min)).not.toBe(min);
  });
});
