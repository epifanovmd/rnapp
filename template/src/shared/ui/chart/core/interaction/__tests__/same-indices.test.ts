import { sameIndices } from "../same-indices";

describe("sameIndices", () => {
  it("сравнивает по значениям", () => {
    expect(sameIndices([1, 2], [1, 2])).toBe(true);
    expect(sameIndices([1, 2], [1, 3])).toBe(false);
    expect(sameIndices([1], [1, 2])).toBe(false);
    expect(sameIndices(null, [1])).toBe(false);
    expect(sameIndices(undefined, undefined)).toBe(true);
  });

  it("объявлен как worklet", () => {
    expect(sameIndices.toString()).toMatch(/["']worklet["']/);
  });
});
