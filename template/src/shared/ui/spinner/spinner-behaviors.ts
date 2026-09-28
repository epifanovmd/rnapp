import { Easing } from "react-native-reanimated";

import { ISpinnerArc, ISpinnerBehavior } from "./spinner.types";

const WORM_ARC_MIN = 0.02;
const WORM_ARC_MAX = 0.98;

/**
 * «Червяк» с заякоренными концами: рост — хвост на месте, голова уходит
 * вперёд почти до полного круга; сжатие — голова на месте, хвост догоняет.
 * Шов цикла ≈ 0.04 окружности — визуально бесшовно; контейнер непрерывно
 * вращается (периоды фазы и вращения не кратны).
 */
export const WORM_SPINNER_BEHAVIOR: ISpinnerBehavior = {
  phaseDuration: 1333,
  phaseEasing: Easing.inOut(Easing.ease),
  rotationDuration: 1568,
  getArc: (phase: number): ISpinnerArc => {
    "worklet";

    const grow = Math.min(phase * 2, 1);
    const shrink = Math.max(phase * 2 - 1, 0);
    const length =
      WORM_ARC_MIN + (WORM_ARC_MAX - WORM_ARC_MIN) * (grow - shrink);

    return {
      length,
      offset: shrink > 0 ? WORM_ARC_MAX - length : 0,
    };
  },
};

/** Классика: дуга фиксированной длины, равномерное вращение. */
export const CLASSIC_SPINNER_BEHAVIOR: ISpinnerBehavior = {
  phaseDuration: 1000,
  rotationDuration: 900,
  getArc: (): ISpinnerArc => {
    "worklet";

    return { length: 0.75, offset: 0 };
  },
};
