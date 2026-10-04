import {
  FEED_BENCHMARK_SCENARIOS,
  formatBenchmarkResult,
  MAX_RUN_DISTANCE,
} from "../feed-benchmark";

describe("feed-benchmark", () => {
  it("сценарии с уникальными id и положительной дистанцией", () => {
    const ids = FEED_BENCHMARK_SCENARIOS.map(scenario => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
    FEED_BENCHMARK_SCENARIOS.forEach(scenario =>
      expect(scenario.distance).toBeGreaterThan(0),
    );
  });

  it("прогон с постоянной скоростью — 8 с, но не дальше предела ленты", () => {
    FEED_BENCHMARK_SCENARIOS.forEach(scenario => {
      if (scenario.mode === "constant") {
        expect(scenario.distance).toBe(
          Math.min(scenario.speed * 8, MAX_RUN_DISTANCE),
        );
      }
    });
  });

  it("форматирует результат одной строкой с меткой для поиска в логе", () => {
    expect(
      formatBenchmarkResult({
        list: "AnchorList",
        scenario: "5k px/s",
        drawDistance: 250,
        durationMs: 8012,
        fps: { averageFPS: 58.34, minFPS: 41 },
      }),
    ).toBe(
      "[feed-bench] AnchorList · 5k px/s · dd=250 · 8012 ms · JS FPS avg 58.3 min 41.0",
    );
  });
});
