import { useCallback, useEffect, useRef, useState } from "react";

import { autoScroll, IAutoScrollToken } from "./auto-scroll";
import {
  BENCHMARK_DRAW_DISTANCE,
  BENCHMARK_JUMP_HOLD_MS,
  BENCHMARK_SETTLE_MS,
  formatBenchmarkResult,
  formatDrawDistance,
  IFeedBenchmarkResult,
  TFeedBenchmarkScenario,
} from "./feed-benchmark";
import { createFpsMonitor } from "./fps-monitor";
import { createScrollDriver, INativeScrollable } from "./scroll-driver";

/** Внешний замер на время прогона — например, встроенный профайлер списка. */
export interface IFeedBenchmarkSession {
  start: (label: string) => void;
  stop: () => void;
}

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * Бенчмарк ленты в одинаковых условиях: старт с 0 после паузы, скролл
 * нативного ScrollView по сценарию, JS FPS за прогон. Результат — на экран и в лог.
 */
export const useFeedBenchmark = (
  list: string,
  getScrollView: () => INativeScrollable | null | undefined,
  session?: IFeedBenchmarkSession,
) => {
  const tokenRef = useRef<IAutoScrollToken | null>(null);
  const [drawDistance, setDrawDistance] = useState<number | undefined>(
    BENCHMARK_DRAW_DISTANCE,
  );
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<IFeedBenchmarkResult | null>(null);

  useEffect(
    () => () => {
      if (tokenRef.current) tokenRef.current.cancelled = true;
      session?.stop();
    },
    [session],
  );

  const run = useCallback(
    async (scenario: TFeedBenchmarkScenario) => {
      const scrollTo = createScrollDriver(getScrollView);

      if (running || !scrollTo(0, false)) return;

      const token: IAutoScrollToken = { cancelled: false };

      tokenRef.current = token;
      setRunning(scenario.id);
      await wait(BENCHMARK_SETTLE_MS);

      const monitor = createFpsMonitor();
      const startedAt = Date.now();

      session?.start(
        `${list} · ${scenario.label} · dd=${formatDrawDistance(drawDistance)}`,
      );
      monitor.start();

      if (scenario.mode === "constant") {
        await autoScroll(
          offset => scrollTo(offset, false),
          scenario.distance,
          scenario.speed,
          token,
        );
      } else {
        scrollTo(scenario.distance, true);
        await wait(BENCHMARK_JUMP_HOLD_MS);
      }

      const fps = monitor.stop();

      session?.stop();

      if (token.cancelled) return;

      const next: IFeedBenchmarkResult = {
        list,
        scenario: scenario.label,
        drawDistance,
        durationMs: Date.now() - startedAt,
        fps,
      };

      console.log(formatBenchmarkResult(next));
      setResult(next);
      setRunning(null);
    },
    [drawDistance, getScrollView, list, running, session],
  );

  return {
    drawDistance,
    panel: {
      drawDistance,
      onDrawDistanceChange: setDrawDistance,
      running,
      result,
      onRun: run,
    },
  };
};
