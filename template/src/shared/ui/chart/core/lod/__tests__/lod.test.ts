import {
  buildLodLevels,
  LodPoint,
  lowerBoundX,
  nearestIndexX,
  sliceExtent,
  upperBoundX,
  visibleSlice,
} from "../lod";

const line = (count: number, y = (x: number) => x): LodPoint[] =>
  Array.from({ length: count }, (_, x) => ({ x, y: y(x) }));

describe("buildLodLevels", () => {
  it("уровень 0 — исходные данные без копии", () => {
    const data = line(10);

    expect(buildLodLevels(data)[0]).toBe(data);
  });

  it("каждый уровень примерно вдвое короче, пока длинный", () => {
    const levels = buildLodLevels(line(10_000));

    expect(levels.length).toBeGreaterThan(5);
    for (let index = 1; index < levels.length; index++) {
      expect(levels[index].length).toBeLessThanOrEqual(
        // Неполная последняя корзина даёт до двух точек.
        Math.ceil(levels[index - 1].length / 2) + 1,
      );
    }
    expect(levels[levels.length - 1].length).toBeLessThanOrEqual(128);
  });

  it("пики сохраняются на всех уровнях", () => {
    const data = line(5000, x => (x === 3333 ? 1000 : x === 1234 ? -1000 : 0));
    const levels = buildLodLevels(data);

    for (const level of levels) {
      expect(Math.max(...level.map(point => point.y))).toBe(1000);
      expect(Math.min(...level.map(point => point.y))).toBe(-1000);
    }
  });

  it("порядок по X сохраняется", () => {
    const levels = buildLodLevels(line(3000, x => Math.sin(x)));

    for (const level of levels) {
      for (let index = 1; index < level.length; index++) {
        expect(level[index].x).toBeGreaterThan(level[index - 1].x);
      }
    }
  });
});

describe("поиск по X", () => {
  const points = [0, 10, 20, 30].map(x => ({ x, y: 0 }));

  it("lowerBoundX / upperBoundX", () => {
    expect(lowerBoundX(points, 15)).toBe(2);
    expect(lowerBoundX(points, 20)).toBe(2);
    expect(lowerBoundX(points, 99)).toBe(4);
    expect(upperBoundX(points, 15)).toBe(1);
    expect(upperBoundX(points, 20)).toBe(2);
    expect(upperBoundX(points, -1)).toBe(-1);
  });

  it("nearestIndexX", () => {
    expect(nearestIndexX(points, 14)).toBe(1);
    expect(nearestIndexX(points, 16)).toBe(2);
    expect(nearestIndexX(points, 15)).toBe(1);
    expect(nearestIndexX(points, 100)).toBe(3);
    expect(nearestIndexX([], 1)).toBe(-1);
  });
});

describe("visibleSlice", () => {
  it("срез с точкой за каждым краем", () => {
    const levels = buildLodLevels(line(100));

    expect(visibleSlice(levels, 10.5, 20.5, 1000)).toEqual({
      level: 0,
      from: 10,
      to: 21,
    });
  });

  it("на краях данных не выходит за массив", () => {
    const levels = buildLodLevels(line(100));

    expect(visibleSlice(levels, 0, 99, 1000)).toEqual({
      level: 0,
      from: 0,
      to: 99,
    });
  });

  it("точек в окне не больше maxPoints (с точностью до краёв)", () => {
    const levels = buildLodLevels(line(100_000));
    const slice = visibleSlice(levels, 0, 99_999, 400);

    expect(slice).not.toBeNull();
    expect(slice!.level).toBeGreaterThan(0);
    expect(slice!.to - slice!.from + 1).toBeLessThanOrEqual(400 * 2);
  });

  it("узкое окно — исходные точки", () => {
    const levels = buildLodLevels(line(100_000));

    expect(visibleSlice(levels, 500, 600, 400)?.level).toBe(0);
  });

  it("без данных — null", () => {
    expect(visibleSlice([[]], 0, 1, 10)).toBeNull();
  });
});

describe("sliceExtent", () => {
  const points = line(10, x => x * 10);

  it("по точкам внутри окна", () => {
    expect(sliceExtent(points, { level: 0, from: 2, to: 6 }, 3, 5)).toEqual([
      30, 50,
    ]);
  });

  it("окно между точками — по соседям", () => {
    expect(sliceExtent(points, { level: 0, from: 3, to: 4 }, 3.2, 3.8)).toEqual(
      [30, 40],
    );
  });
});

describe("worklet", () => {
  it("функции объявлены как worklet", () => {
    for (const fn of [
      buildLodLevels,
      lowerBoundX,
      upperBoundX,
      nearestIndexX,
      visibleSlice,
      sliceExtent,
    ]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
