/** JS FPS за прогон. */
export interface IFpsResult {
  averageFPS: number;
  /** Худшее секундное окно. */
  minFPS: number;
}

const WINDOW_MS = 1000;

/** Счётчик JS FPS по кадрам `requestAnimationFrame`: среднее и худшее окно. */
export const createFpsMonitor = (now: () => number = Date.now) => {
  let running = false;
  let frames = 0;
  let windowFrames = 0;
  let startedAt = 0;
  let windowStartedAt = 0;
  let minFPS = Infinity;

  const tick = () => {
    if (!running) return;

    frames++;
    windowFrames++;

    const time = now();

    if (time - windowStartedAt >= WINDOW_MS) {
      minFPS = Math.min(
        minFPS,
        (windowFrames * 1000) / (time - windowStartedAt),
      );
      windowFrames = 0;
      windowStartedAt = time;
    }

    requestAnimationFrame(tick);
  };

  return {
    start: () => {
      running = true;
      frames = 0;
      windowFrames = 0;
      minFPS = Infinity;
      startedAt = now();
      windowStartedAt = startedAt;
      requestAnimationFrame(tick);
    },
    stop: (): IFpsResult => {
      running = false;

      const averageFPS = (frames * 1000) / Math.max(1, now() - startedAt);

      return {
        averageFPS,
        minFPS: Number.isFinite(minFPS) ? minFPS : averageFPS,
      };
    },
  };
};
