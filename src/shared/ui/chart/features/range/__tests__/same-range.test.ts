import { sameRange } from "../same-range";

describe("sameRange", () => {
  it("сравнивает диапазоны по границам", () => {
    expect(sameRange([1, 4], [1, 4])).toBe(true);
    expect(sameRange([1, 4], [1, 5])).toBe(false);
    expect(sameRange(null, null)).toBe(true);
    expect(sameRange(null, undefined)).toBe(false);
    expect(sameRange([1, 4], null)).toBe(false);
  });

  // Вызывается из useAnimatedReaction на UI-потоке: без директивы worklets
  // падает с «Tried to synchronously call a Remote Function».
  it("объявлен как worklet", () => {
    expect(sameRange.toString()).toMatch(/["']worklet["']/);
  });
});
