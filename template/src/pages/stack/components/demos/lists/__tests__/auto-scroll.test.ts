import { autoScroll } from "../auto-scroll";
import { createFpsMonitor } from "../fps-monitor";

describe("autoScroll", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("едет с постоянной скоростью и останавливается на дистанции", async () => {
    const offsets: number[] = [];
    const done = autoScroll(offset => offsets.push(offset), 1000, 10_000, {
      cancelled: false,
    });

    jest.advanceTimersByTime(200);

    await expect(done).resolves.toBe(true);
    // 10 px/мс: кадр в 16 мс — шаг 160 px.
    expect(offsets[0]).toBe(160);
    expect(offsets[offsets.length - 1]).toBe(1000);
  });

  it("останавливается по отмене", async () => {
    const token = { cancelled: false };
    const scrollTo = jest.fn();
    const done = autoScroll(scrollTo, 100_000, 10_000, token);

    jest.advanceTimersByTime(32);
    token.cancelled = true;
    jest.advanceTimersByTime(32);

    await expect(done).resolves.toBe(false);
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });
});

describe("createFpsMonitor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("считает кадры за прогон", () => {
    const monitor = createFpsMonitor();

    monitor.start();
    jest.advanceTimersByTime(2000);

    const result = monitor.stop();

    // Кадр в 16 мс — 62.5 кадра в секунду.
    expect(result.averageFPS).toBeCloseTo(62.5, 0);
    expect(result.minFPS).toBeCloseTo(62.5, 0);
  });
});
