import { formatTimeTick } from "../format-time-tick";
import { pickTimeStep, timeTicks } from "../time-ticks";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe("pickTimeStep", () => {
  it("самый мелкий шаг, при котором делений не больше count", () => {
    expect(pickTimeStep(DAY, 5)).toMatchObject({ unit: "hour", count: 6 });
    expect(pickTimeStep(7 * DAY, 5)).toMatchObject({ unit: "day", count: 2 });
    expect(pickTimeStep(30 * DAY, 5)).toMatchObject({ unit: "week" });
    expect(pickTimeStep(365 * DAY, 5)).toMatchObject({
      unit: "month",
      count: 3,
    });
  });
});

describe("timeTicks", () => {
  it("часы выровнены по местному времени", () => {
    const start = new Date(2025, 2, 10, 1, 17).getTime();
    const end = new Date(2025, 2, 11, 1, 17).getTime();
    const { unit, values } = timeTicks(start, end, 5);

    expect(unit).toBe("hour");
    expect(values.map(value => new Date(value).getHours())).toEqual([
      6, 12, 18, 0,
    ]);
  });

  it("месяцы — с первого числа, разной длины", () => {
    const start = new Date(2025, 0, 15).getTime();
    const end = new Date(2025, 5, 20).getTime();
    const { unit, values } = timeTicks(start, end, 6);

    expect(unit).toBe("month");
    expect(values).toEqual([
      new Date(2025, 1, 1).getTime(),
      new Date(2025, 2, 1).getTime(),
      new Date(2025, 3, 1).getTime(),
      new Date(2025, 4, 1).getTime(),
      new Date(2025, 5, 1).getTime(),
    ]);
  });

  it("недели — с понедельника", () => {
    const start = new Date(2025, 0, 1).getTime();
    const end = new Date(2025, 0, 29).getTime();
    const { unit, values } = timeTicks(start, end, 5);

    expect(unit).toBe("week");
    expect(values.every(value => new Date(value).getDay() === 1)).toBe(true);
  });

  it("деления только внутри пределов", () => {
    const start = new Date(2025, 0, 1, 10).getTime();
    const end = start + 6 * HOUR;
    const { values } = timeTicks(start, end, 6);

    expect(values.every(value => value >= start && value <= end)).toBe(true);
  });

  it("вырожденный вход — без делений и без зацикливания", () => {
    expect(timeTicks(NaN, 10, 5).values).toEqual([]);
    expect(timeTicks(10, 5, 5).values).toEqual([]);
  });

  it("объявлены как worklet", () => {
    expect(timeTicks.toString()).toMatch(/["']worklet["']/);
    expect(pickTimeStep.toString()).toMatch(/["']worklet["']/);
  });
});

describe("formatTimeTick", () => {
  it("вид подписи по единице шага", () => {
    expect(formatTimeTick(new Date(2025, 9, 5, 14, 30).getTime(), "hour")).toBe(
      "14:30",
    );
    expect(formatTimeTick(new Date(2025, 9, 5).getTime(), "hour")).toBe(
      "5 окт",
    );
    expect(formatTimeTick(new Date(2025, 9, 5).getTime(), "day")).toBe("5 окт");
    expect(formatTimeTick(new Date(2025, 9, 1).getTime(), "month")).toBe("Окт");
    expect(formatTimeTick(new Date(2026, 0, 1).getTime(), "month")).toBe(
      "2026",
    );
    expect(formatTimeTick(new Date(2026, 0, 1).getTime(), "year")).toBe("2026");
  });
});
