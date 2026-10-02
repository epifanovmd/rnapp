import {
  resolveRevealRange,
  revealProgress,
  subProgress,
} from "../reveal-progress";

describe("resolveRevealRange", () => {
  it("доли высоты якоря", () => {
    expect(resolveRevealRange(100, {})).toEqual([30, 100]);
    expect(resolveRevealRange(100, { start: 0, end: 0.5 })).toEqual([0, 50]);
  });

  it("distance вместо end", () => {
    expect(resolveRevealRange(100, { start: 0.5, distance: 20 })).toEqual([
      50, 70,
    ]);
  });

  it("путь не короче 1 px", () => {
    expect(resolveRevealRange(100, { start: 1, end: 1 })).toEqual([100, 101]);
  });
});

describe("revealProgress", () => {
  it("якорь виден — 0, ушёл — 1, между — линейно", () => {
    // Якорь 100 px на y=200, переход с 30 до 100 px.
    expect(revealProgress(0, 200, 100, {})).toBe(0);
    expect(revealProgress(230, 200, 100, {})).toBe(0);
    expect(revealProgress(265, 200, 100, {})).toBeCloseTo(0.5);
    expect(revealProgress(300, 200, 100, {})).toBe(1);
    expect(revealProgress(1000, 200, 100, {})).toBe(1);
  });

  it("до измерения — 0", () => {
    expect(revealProgress(500, 0, 0, {})).toBe(0);
  });
});

describe("subProgress", () => {
  it("участок общего прогресса", () => {
    expect(subProgress(0.5, 0.5, 1)).toBe(0);
    expect(subProgress(0.75, 0.5, 1)).toBe(0.5);
    expect(subProgress(1, 0.5, 1)).toBe(1);
  });

  it("объявлены как worklet", () => {
    for (const fn of [resolveRevealRange, revealProgress, subProgress]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
