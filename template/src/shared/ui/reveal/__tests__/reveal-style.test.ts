import { revealStyle } from "../reveal-style";

const base = {
  preset: "slide-up" as const,
  inverse: false,
  range: [0, 1] as const,
  distance: 10,
  scaleFrom: 0.9,
};

describe("revealStyle", () => {
  it("slide-up: снизу и прозрачный → на месте и видимый", () => {
    expect(revealStyle(0, base)).toEqual({
      opacity: 0,
      translateY: 10,
      scale: 1,
    });
    expect(revealStyle(1, base)).toEqual({ opacity: 1, translateY: 0, scale: 1 });
  });

  it("inverse — исчезает", () => {
    expect(revealStyle(1, { ...base, inverse: true }).opacity).toBe(0);
    expect(revealStyle(0, { ...base, inverse: true }).opacity).toBe(1);
  });

  it("участок прогресса", () => {
    const style = { ...base, preset: "fade" as const, range: [0.5, 1] as const };

    expect(revealStyle(0.4, style).opacity).toBe(0);
    expect(revealStyle(0.75, style).opacity).toBe(0.5);
  });

  it("scale и slide-down", () => {
    expect(revealStyle(0, { ...base, preset: "scale" }).scale).toBe(0.9);
    expect(revealStyle(0, { ...base, preset: "slide-down" }).translateY).toBe(
      -10,
    );
  });

  it("объявлен как worklet", () => {
    expect(revealStyle.toString()).toMatch(/["']worklet["']/);
  });
});
