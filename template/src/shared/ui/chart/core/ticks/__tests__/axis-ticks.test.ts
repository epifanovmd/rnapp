import { createLinearScale } from "../../scale/linear-scale";
import { computeTicks } from "../axis-ticks";

describe("computeTicks", () => {
  const scale = createLinearScale([0, 100], [0, 300]);

  it("nice — деления за краями с тем же шагом", () => {
    expect(computeTicks(scale, "nice", 5, 0).values).toEqual([
      0, 20, 40, 60, 80, 100,
    ]);
    expect(computeTicks(scale, "nice", 5, 0.5).values).toEqual([
      -40, -20, 0, 20, 40, 60, 80, 100, 120, 140,
    ]);
  });

  it("divide — равные доли без расширения", () => {
    expect(computeTicks(scale, "divide", 4, 0.5).values).toEqual([
      0, 25, 50, 75, 100,
    ]);
  });

  it("ключ стабилен при сдвиге окна внутри шага", () => {
    const a = computeTicks(createLinearScale([1, 99], [0, 300]), "nice", 5, 0);
    const b = computeTicks(createLinearScale([2, 98], [0, 300]), "nice", 5, 0);

    expect(a.key).toBe(b.key);
  });

  it("time — единица шага", () => {
    const day = 86_400_000;
    const from = new Date(2025, 0, 1).getTime();
    const ticks = computeTicks(
      createLinearScale([from, from + 30 * day], [0, 300]),
      "time",
      5,
      0,
    );

    expect(ticks.unit).toBe("week");
  });

  it("пустой домен — без делений", () => {
    expect(
      computeTicks(createLinearScale([5, 5], [0, 1]), "nice", 5, 0).values,
    ).toEqual([]);
  });

  it("объявлен как worklet", () => {
    expect(computeTicks.toString()).toMatch(/["']worklet["']/);
  });
});
