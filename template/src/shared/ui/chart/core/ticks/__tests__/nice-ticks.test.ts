import { divideTicks, niceDomain, niceStep, niceTicks } from "../nice-ticks";

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
