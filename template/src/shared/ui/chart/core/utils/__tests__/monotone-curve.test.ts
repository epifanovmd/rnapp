import { monotoneSegments } from "../monotone-curve";

/** Неравномерный шаг: пауза в данных, затем точки раз в секунду — так было с петлёй. */
const UNEVEN = [
  { x: 0, y: 400 },
  { x: 700, y: 50 },
  { x: 710, y: 0 },
  { x: 720, y: 300 },
  { x: 730, y: 0 },
];

describe("monotoneSegments", () => {
  it("опорные точки не выходят за соседей по X — нет петель", () => {
    const segments = monotoneSegments(UNEVEN);

    segments.forEach((segment, index) => {
      const from = UNEVEN[index];
      const to = UNEVEN[index + 1];

      for (const x of [segment.c1x, segment.c2x]) {
        expect(x).toBeGreaterThanOrEqual(from.x);
        expect(x).toBeLessThanOrEqual(to.x);
      }
    });
  });

  it("не перелетает значения соседних точек — нет провала ниже нуля", () => {
    const segments = monotoneSegments(UNEVEN);

    segments.forEach((segment, index) => {
      const low = Math.min(UNEVEN[index].y, UNEVEN[index + 1].y);
      const high = Math.max(UNEVEN[index].y, UNEVEN[index + 1].y);

      for (const y of [segment.c1y, segment.c2y]) {
        expect(y).toBeGreaterThanOrEqual(low - 1e-9);
        expect(y).toBeLessThanOrEqual(high + 1e-9);
      }
    });
  });

  it("сегмент на каждую пару точек, конец — в следующей точке", () => {
    const segments = monotoneSegments(UNEVEN);

    expect(segments).toHaveLength(UNEVEN.length - 1);
    expect(segments.at(-1)).toMatchObject({ x: 730, y: 0 });
  });

  it("локальный экстремум — горизонтальная касательная", () => {
    const [first, second] = monotoneSegments([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);

    expect(first.c2y).toBe(10);
    expect(second.c1y).toBe(10);
  });

  it("меньше трёх точек — без сегментов кривой", () => {
    expect(monotoneSegments([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toEqual([]);
  });

  it("объявлен как worklet", () => {
    expect(monotoneSegments.toString()).toMatch(/["']worklet["']/);
  });
});
