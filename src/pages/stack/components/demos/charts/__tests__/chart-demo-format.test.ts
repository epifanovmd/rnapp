import { createRandomWalk } from "../chart-mock-data";

// Индекс графиков тянет Skia; данным нужна только палитра.
jest.mock("@shared/ui/chart", () => ({ seriesColor: () => "#000000" }));

describe("createRandomWalk", () => {
  it("count точек с шагом stepMs, последняя — на end", () => {
    const data = createRandomWalk(1000, 60_000, 1_000_000_000);

    expect(data).toHaveLength(1000);
    expect(data[data.length - 1].x).toBe(1_000_000_000);
    expect(data[1].x - data[0].x).toBe(60_000);
  });

  it("детерминирован по seed", () => {
    expect(createRandomWalk(50, 1, 100, 7)).toEqual(
      createRandomWalk(50, 1, 100, 7),
    );
  });
});
