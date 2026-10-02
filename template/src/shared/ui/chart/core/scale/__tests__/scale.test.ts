import {
  createLinearScale,
  isInScaleRange,
  scaleToDomain,
  scaleToRange,
} from "../linear-scale";
import { resolveAutoYDomain } from "../y-domain";

describe("linear scale", () => {
  const scale = createLinearScale([0, 100], [10, 210]);

  it("домен ↔ пиксели", () => {
    expect(scaleToRange(scale, 50)).toBe(110);
    expect(scaleToDomain(scale, 110)).toBe(50);
  });

  it("перевёрнутый диапазон (ось Y)", () => {
    const y = createLinearScale([0, 10], [200, 0]);

    expect(scaleToRange(y, 10)).toBe(0);
    expect(scaleToDomain(y, 200)).toBe(0);
  });

  it("попадание в диапазон с допуском", () => {
    expect(isInScaleRange(scale, 9, 0)).toBe(false);
    expect(isInScaleRange(scale, 9, 2)).toBe(true);
  });
});

describe("resolveAutoYDomain", () => {
  it("запас по краям", () => {
    expect(resolveAutoYDomain([0, 100], { paddingRatio: 0.1 })).toEqual([
      -10, 110,
    ]);
  });

  it("ноль остаётся краем при beginAtZero", () => {
    expect(
      resolveAutoYDomain([20, 100], { beginAtZero: true, paddingRatio: 0.1 }),
    ).toEqual([0, 110]);
  });

  it("«круглые» края", () => {
    expect(resolveAutoYDomain([13, 87], { niceTickCount: 5 })).toEqual([
      0, 100,
    ]);
  });

  it("одно значение — домен вокруг него", () => {
    expect(resolveAutoYDomain([50, 50], {})).toEqual([45, 55]);
    expect(resolveAutoYDomain([0, 0], {})).toEqual([-1, 1]);
  });

  it("объявлены как worklet", () => {
    for (const fn of [
      resolveAutoYDomain,
      scaleToRange,
      scaleToDomain,
      createLinearScale,
    ]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
