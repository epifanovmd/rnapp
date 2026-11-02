import { subProgress } from "@shared/lib/scroll-reveal";

/**
 * Пресет появления:
 * - `"slide-up"` — выезжает снизу и проявляется (как заголовок в шапку);
 * - `"slide-down"` — выезжает сверху;
 * - `"fade"` — только прозрачность;
 * - `"scale"` — увеличивается от `scaleFrom` и проявляется.
 */
export type TRevealPreset = "slide-up" | "slide-down" | "fade" | "scale";

export interface IRevealStyleOptions {
  preset: TRevealPreset;
  /** Исчезать по прогрессу, а не появляться. */
  inverse: boolean;
  /** Участок прогресса, на котором идёт анимация. */
  range: readonly [number, number];
  /** Сдвиг для slide, px. */
  distance: number;
  /** Начальный масштаб для `"scale"`. */
  scaleFrom: number;
}

export interface IRevealStyle {
  opacity: number;
  translateY: number;
  scale: number;
}

/** Стиль появления по прогрессу (worklet): видимость 0…1 → прозрачность, сдвиг, масштаб. */
export const revealStyle = (
  progress: number,
  options: IRevealStyleOptions,
): IRevealStyle => {
  "worklet";

  const local = subProgress(progress, options.range[0], options.range[1]);
  const shown = options.inverse ? 1 - local : local;
  const hidden = 1 - shown;
  let translateY = 0;
  let scale = 1;

  if (options.preset === "slide-up") {
    translateY = hidden * options.distance;
  } else if (options.preset === "slide-down") {
    translateY = -hidden * options.distance;
  } else if (options.preset === "scale") {
    scale = options.scaleFrom + (1 - options.scaleFrom) * shown;
  }

  return { opacity: shown, translateY, scale };
};
