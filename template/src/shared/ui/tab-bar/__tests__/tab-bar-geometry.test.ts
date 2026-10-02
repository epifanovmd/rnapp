import {
  frameAt,
  indicatorSpan,
  tabFrames,
  tabWeight,
  totalWeight,
  wormDelays,
} from "../tab-bar-geometry";

describe("tabWeight / totalWeight", () => {
  it("активная — activeWeight, остальные — 1, между — плавно", () => {
    expect(tabWeight(1, 1, 2)).toBe(2);
    expect(tabWeight(1, 0, 2)).toBe(1);
    expect(tabWeight(0.5, 0, 2)).toBe(1.5);
    expect(tabWeight(0.5, 1, 2)).toBe(1.5);
  });

  it("сумма весов при переходе постоянна", () => {
    for (const position of [0, 0.25, 0.5, 1, 1.7, 3]) {
      const sum = [0, 1, 2, 3].reduce(
        (acc, index) => acc + tabWeight(position, index, 2.5),
        0,
      );

      expect(sum).toBeCloseTo(totalWeight(4, 2.5));
    }
  });
});

describe("tabFrames", () => {
  it("равные веса — равные вкладки", () => {
    expect(tabFrames(0, 4, 1, 400)).toEqual([
      { x: 0, width: 100 },
      { x: 100, width: 100 },
      { x: 200, width: 100 },
      { x: 300, width: 100 },
    ]);
  });

  it("активная шире, панель заполнена целиком", () => {
    const frames = tabFrames(1, 3, 2, 400);

    expect(frames.map(frame => frame.width)).toEqual([100, 200, 100]);
    expect(frames[2].x + frames[2].width).toBe(400);
  });
});

describe("frameAt / indicatorSpan", () => {
  const frames = tabFrames(0, 3, 1, 300);

  it("дробное положение — между вкладками", () => {
    expect(frameAt(frames, 0.5)).toEqual({ x: 50, width: 100 });
    expect(frameAt(frames, 5)).toEqual({ x: 200, width: 100 });
  });

  it("подложка от левого края start до правого края end", () => {
    expect(indicatorSpan(frames, 0, 1)).toEqual({ x: 0, width: 200 });
    expect(indicatorSpan(frames, 1, 1)).toEqual({ x: 100, width: 100 });
  });
});

describe("wormDelays", () => {
  it("догоняющий край — с задержкой", () => {
    expect(wormDelays(0, 2, 150)).toEqual({ start: 150, end: 0 });
    expect(wormDelays(2, 0, 150)).toEqual({ start: 0, end: 150 });
  });

  it("геометрия — worklet", () => {
    for (const fn of [tabWeight, totalWeight, tabFrames, frameAt, indicatorSpan]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});
