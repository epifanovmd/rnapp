import {
  divideTicks,
  niceDomain,
  niceStep,
  niceTicks,
  tickDecimals,
  unitMagnitude,
} from "../nice-ticks";

describe("niceStep", () => {
  it("округляет шаг до 1, 2, 2.5, 5 × 10ⁿ", () => {
    expect(niceStep(100, 5)).toBe(20);
    expect(niceStep(100, 4)).toBe(25);
    expect(niceStep(1, 5)).toBeCloseTo(0.2);
    expect(niceStep(7, 5)).toBe(2);
    expect(niceStep(4500, 5)).toBe(1000);
  });

  it("на пустом размахе — 0", () => {
    expect(niceStep(0, 5)).toBe(0);
    expect(niceStep(10, 0)).toBe(0);
  });
});

describe("niceTicks", () => {
  it("деления кратны шагу и лежат в пределах", () => {
    expect(niceTicks(3, 97, 5)).toEqual([20, 40, 60, 80]);
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("без хвостов плавающей точки", () => {
    expect(niceTicks(0, 0.6, 3)).toEqual([0, 0.2, 0.4, 0.6]);
  });

  it("отрицательные значения", () => {
    expect(niceTicks(-50, 50, 4)).toEqual([-50, -25, 0, 25, 50]);
  });
});

describe("divideTicks", () => {
  it("равные доли с краями", () => {
    expect(divideTicks(0, 100, 4)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe("niceDomain", () => {
  it("расширяет края до кратных шага", () => {
    expect(niceDomain(3, 97, 5)).toEqual([0, 100]);
    expect(niceDomain(103, 187, 4)).toEqual([100, 200]);
  });

  it("стабилен при малом сдвиге экстента", () => {
    expect(niceDomain(12, 88, 5)).toEqual(niceDomain(14, 86, 5));
  });
});

describe("worklet", () => {
  it("функции объявлены как worklet", () => {
    for (const fn of [niceStep, niceTicks, divideTicks, niceDomain]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});

describe("binary (1024ᵏ)", () => {
  const MB = 1024 * 1024;

  it("unitMagnitude — единица, где значение в [1, base)", () => {
    expect(unitMagnitude(500, 1024)).toBe(1);
    expect(unitMagnitude(976.6 * 1024, 1024)).toBe(1024);
    expect(unitMagnitude(3.8 * MB, 1024)).toBe(MB);
    expect(unitMagnitude(0, 1024)).toBe(1);
  });

  it("шаг круглый в единицах: целые МБ", () => {
    expect(niceTicks(0, 3.8 * MB, 4, undefined, MB)).toEqual([
      0,
      MB,
      2 * MB,
      3 * MB,
    ]);
  });

  it("домен до круглых МБ", () => {
    expect(niceDomain(0, 3.8 * MB, 4, MB)).toEqual([0, 4 * MB]);
  });

  it("tickDecimals — знаков для шага в единицах", () => {
    expect(tickDecimals(MB, MB)).toBe(0);
    expect(tickDecimals(0.5 * MB, MB)).toBe(1);
    expect(tickDecimals(0.25 * MB, MB)).toBe(2);
  });
});
