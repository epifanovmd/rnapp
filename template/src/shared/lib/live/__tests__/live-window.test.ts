import {
  mergeLivePoints,
  pushLivePoint,
  trimLivePoints,
} from "../live-window";

const point = (ts: number, value = ts) => ({ ts, value });

describe("trimLivePoints", () => {
  it("без границ возвращает все точки", () => {
    const points = [point(1), point(2), point(3)];

    expect(trimLivePoints(points)).toEqual(points);
  });

  it("держит отрезок windowMs от самой новой точки", () => {
    const points = [point(0), point(500), point(1000), point(1500)];

    expect(trimLivePoints(points, { windowMs: 1000 })).toEqual([
      point(1000),
      point(1500),
    ]);
  });

  it("держит не больше maxPoints последних точек", () => {
    const points = [point(1), point(2), point(3)];

    expect(trimLivePoints(points, { maxPoints: 2 })).toEqual([
      point(2),
      point(3),
    ]);
  });
});

describe("pushLivePoint", () => {
  it("добавляет новую точку и обрезает окно", () => {
    const points = [point(1), point(2)];

    expect(pushLivePoint(points, point(3), { maxPoints: 2 })).toEqual([
      point(2),
      point(3),
    ]);
  });

  it("точку не новее последней отбрасывает, возвращая прежний массив", () => {
    const points = [point(1), point(2)];

    expect(pushLivePoint(points, point(2, 99))).toBe(points);
    expect(pushLivePoint(points, point(1))).toBe(points);
  });

  it("в пустое окно кладёт первую точку", () => {
    expect(pushLivePoint([], point(5))).toEqual([point(5)]);
  });
});

describe("mergeLivePoints", () => {
  it("история — основа, из живых остаются только более новые", () => {
    const history = [point(1), point(2, 20), point(3)];
    const live = [point(2, 99), point(3, 99), point(4), point(5)];

    expect(mergeLivePoints(history, live)).toEqual([
      point(1),
      point(2, 20),
      point(3),
      point(4),
      point(5),
    ]);
  });

  it("пустая история оставляет живые точки", () => {
    const live = [point(1), point(2)];

    expect(mergeLivePoints([], live)).toEqual(live);
  });

  it("обрезает результат по границам окна", () => {
    expect(
      mergeLivePoints([point(1), point(2)], [point(3)], { maxPoints: 2 }),
    ).toEqual([point(2), point(3)]);
  });
});
