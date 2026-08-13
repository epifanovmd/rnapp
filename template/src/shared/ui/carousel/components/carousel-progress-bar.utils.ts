import { clamp, getRelativeProgress } from "../carousel-math";
import {
  TCarouselProgressBarsIdleVariant,
  TCarouselProgressBarsMode,
} from "../carousel-progress-bars.types";

export type TProgressBarAlignment = "flex-start" | "flex-end";

export interface IProgressBarFill {
  alignment: TProgressBarAlignment;
  progress: number;
}

interface IProgressBarFillOptions {
  index: number;
  mode: TCarouselProgressBarsMode;
  idleVariant: TCarouselProgressBarsIdleVariant;
  progress: number;
  count: number;
  loop: boolean;
  autoplayActive: boolean;
  activeIndex: number;
  timerProgress: number;
  timerIndex: number;
  touching: boolean;
}

const START: TProgressBarAlignment = "flex-start";

const getIdleTimerFill = ({
  index,
  idleVariant,
  progress,
  count,
  loop,
}: Pick<
  IProgressBarFillOptions,
  "index" | "idleVariant" | "progress" | "count" | "loop"
>): IProgressBarFill => {
  "worklet";

  if (idleVariant === "move") {
    const distance = getRelativeProgress(progress, index, count, loop);

    return {
      progress: Math.max(0, 1 - Math.abs(distance)),
      alignment: distance > 0 ? "flex-end" : START,
    };
  }

  return {
    progress: clamp(progress - index + 1, 0, 1),
    alignment: START,
  };
};

const getCurrentTimerFill = ({
  relativeProgress,
  timerProgress,
  touching,
}: {
  relativeProgress: number;
  timerProgress: number;
  touching: boolean;
}): number => {
  "worklet";

  const swipeProgress = clamp(relativeProgress, -1, 1);

  if (touching) {
    return clamp(timerProgress + swipeProgress, 0, 1);
  }

  return swipeProgress >= 0
    ? timerProgress + (1 - timerProgress) * swipeProgress
    : timerProgress * (1 + swipeProgress);
};

const getAutoplayTimerFill = (
  options: IProgressBarFillOptions,
): IProgressBarFill => {
  "worklet";

  const {
    index,
    progress,
    count,
    loop,
    activeIndex,
    timerProgress,
    timerIndex,
    touching,
  } = options;
  const relativeProgress = getRelativeProgress(
    progress,
    activeIndex,
    count,
    loop,
  );

  if (index === activeIndex) {
    return {
      progress: getCurrentTimerFill({
        relativeProgress,
        timerProgress: timerIndex === activeIndex ? timerProgress : 0,
        touching,
      }),
      alignment: START,
    };
  }

  const nextIndex = loop ? (activeIndex + 1) % count : activeIndex + 1;

  if (relativeProgress > 0 && index === nextIndex) {
    return { progress: 0, alignment: START };
  }

  let relativeIndex = index - activeIndex;

  if (loop && relativeIndex > 0) {
    relativeIndex -= count;
  }

  if (relativeProgress < 0 && relativeIndex < 0) {
    return {
      progress: clamp(relativeProgress - relativeIndex, 0, 1),
      alignment: START,
    };
  }

  return { progress: index < activeIndex ? 1 : 0, alignment: START };
};

export const getProgressBarFill = (
  options: IProgressBarFillOptions,
): IProgressBarFill => {
  "worklet";

  if (options.mode === "scroll") {
    return {
      progress: clamp(options.progress - options.index, 0, 1),
      alignment: START,
    };
  }

  if (!options.autoplayActive) {
    return getIdleTimerFill(options);
  }

  return getAutoplayTimerFill(options);
};
