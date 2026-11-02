import {
  applyNavigatorDrag,
  centerRangeAt,
  resolveNavigatorDrag,
} from "../navigator-drag";

const limits = { min: 0, max: 1000, minSpan: 50 };

describe("resolveNavigatorDrag", () => {
  it("край, перенос, прыжок", () => {
    expect(resolveNavigatorDrag(100, 100, 200, 12)).toBe("left");
    expect(resolveNavigatorDrag(195, 100, 200, 12)).toBe("right");
    expect(resolveNavigatorDrag(150, 100, 200, 12)).toBe("move");
    expect(resolveNavigatorDrag(20, 100, 200, 12)).toBe("jump");
  });

  it("узкая рамка — ближайший край", () => {
    expect(resolveNavigatorDrag(103, 100, 108, 12)).toBe("left");
    expect(resolveNavigatorDrag(106, 100, 108, 12)).toBe("right");
  });
});

describe("applyNavigatorDrag", () => {
  const range = { start: 100, end: 300 };

  it("левый край — не уже minSpan и не за данные", () => {
    expect(applyNavigatorDrag("left", range, 50, limits)).toEqual({
      start: 150,
      end: 300,
    });
    expect(applyNavigatorDrag("left", range, 500, limits)).toEqual({
      start: 250,
      end: 300,
    });
    expect(applyNavigatorDrag("left", range, -500, limits)).toEqual({
      start: 0,
      end: 300,
    });
  });

  it("правый край", () => {
    expect(applyNavigatorDrag("right", range, 900, limits)).toEqual({
      start: 100,
      end: 1000,
    });
    expect(applyNavigatorDrag("right", range, -500, limits)).toEqual({
      start: 100,
      end: 150,
    });
  });

  it("перенос — в пределах данных", () => {
    expect(applyNavigatorDrag("move", range, 800, limits)).toEqual({
      start: 800,
      end: 1000,
    });
  });
});

describe("centerRangeAt", () => {
  it("центр рамки в точке, у края — прижата", () => {
    expect(centerRangeAt({ start: 0, end: 100 }, 500, limits)).toEqual({
      start: 450,
      end: 550,
    });
    expect(centerRangeAt({ start: 0, end: 100 }, 990, limits)).toEqual({
      start: 900,
      end: 1000,
    });
  });

  it("объявлены как worklet", () => {
    for (const fn of [
      resolveNavigatorDrag,
      applyNavigatorDrag,
      centerRangeAt,
    ]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
