import type { IFpsResult } from "./fps-monitor";

/** Фиксированный запас отрисовки для прогонов: без него — значение списка по умолчанию. */
export const BENCHMARK_DRAW_DISTANCE = 250;

/** Фон списка в режиме «Пустоты»: всё, что им окрашено на кадре, — незаполненная область. */
export const BLANK_COLOR = "#FF00FF";

/** Пауза после возврата к началу: список досчитывает раскладку до старта замера. */
export const BENCHMARK_SETTLE_MS = 600;

/** Сколько ждать после нативного прыжка, пока список заполняет вьюпорт. */
export const BENCHMARK_JUMP_HOLD_MS = 1500;

/**
 * Сценарий прогона: `constant` — JS-скролл с постоянной скоростью (`autoScroll`),
 * `jump` — нативная анимация `scrollToOffset` на `distance`, JS-поток свободен.
 */
export type TFeedBenchmarkScenario =
  | {
      id: string;
      label: string;
      mode: "constant";
      distance: number;
      speed: number;
    }
  | { id: string; label: string; mode: "jump"; distance: number };

/** Длительность прогона с постоянной скоростью: дистанция = скорость × время. */
const CONSTANT_RUN_SECONDS = 8;

/**
 * Предел дистанции прогона, px: лента не короче ~1,3 млн px (10 000 ячеек от
 * ~130 px), упор в конец исказил бы замер. Быстрые прогоны из-за него короче 8 с.
 */
export const MAX_RUN_DISTANCE = 1_200_000;

const CONSTANT_SPEEDS = [
  10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 80_000, 100_000, 125_000,
  150_000, 200_000,
];

const JUMP_DISTANCES = [10_000, 30_000, 100_000];

const formatThousands = (value: number) => `${value / 1000}k`;

export const FEED_BENCHMARK_SCENARIOS: readonly TFeedBenchmarkScenario[] = [
  ...CONSTANT_SPEEDS.map((speed): TFeedBenchmarkScenario => ({
    id: `speed-${speed}`,
    label: `${formatThousands(speed)} px/s`,
    mode: "constant",
    distance: Math.min(speed * CONSTANT_RUN_SECONDS, MAX_RUN_DISTANCE),
    speed,
  })),
  ...JUMP_DISTANCES.map((distance): TFeedBenchmarkScenario => ({
    id: `jump-${distance}`,
    label: `Прыжок ${formatThousands(distance)}`,
    mode: "jump",
    distance,
  })),
];

export interface IFeedBenchmarkResult {
  list: string;
  scenario: string;
  drawDistance: number | "default";
  durationMs: number;
  fps: IFpsResult;
}

/** Строка результата для экрана и лога; метка `[feed-bench]` — для поиска в логе. */
export const formatBenchmarkResult = ({
  list,
  scenario,
  drawDistance,
  durationMs,
  fps,
}: IFeedBenchmarkResult) =>
  `[feed-bench] ${list} · ${scenario} · dd=${drawDistance} · ${durationMs} ms · ` +
  `JS FPS avg ${fps.averageFPS.toFixed(1)} min ${fps.minFPS.toFixed(1)}`;
