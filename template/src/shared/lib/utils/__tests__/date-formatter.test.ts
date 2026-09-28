import { DateFormatter } from "../formatter/date-formatter";

const formatter = new DateFormatter();

describe("DateFormatter.formatDiff", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("вчерашняя дата меньше суток назад — «вчера»", () => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 0, 30) });

    expect(
      formatter.formatDiff(new Date(2026, 8, 27, 23, 0).toISOString()),
    ).toBe("вчера");
  });

  it("вчерашняя дата больше суток назад — тоже «вчера»", () => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 12, 0) });

    expect(
      formatter.formatDiff(new Date(2026, 8, 27, 10, 0).toISOString()),
    ).toBe("вчера");
  });

  it("позавчера меньше 48 часов назад — не «вчера»", () => {
    jest.useFakeTimers({ now: new Date(2026, 8, 28, 0, 30) });

    expect(
      formatter.formatDiff(new Date(2026, 8, 26, 23, 0).toISOString()),
    ).toBe("2 дня назад");
  });
});
