import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ISpinnerBehavior } from "../spinner.types";

export interface ISpinnerAnimationOptions {
  behavior: ISpinnerBehavior;
  /** 0..1; задан — детерминированный режим, behavior не анимируется. */
  progress?: SharedValue<number> | number;
  circumference: number;
}

const clamp01 = (value: number): number => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};

/**
 * Движок анимации спиннера (SRP: без разметки): владеет фазой цикла и
 * вращением, превращает стратегию поведения в animated-пропсы дуги.
 */
export const useSpinnerAnimation = ({
  behavior,
  progress,
  circumference,
}: ISpinnerAnimationOptions) => {
  const rotation = useSharedValue(0);
  /** Фаза цикла поведения, 0..1. */
  const phase = useSharedValue(0);

  const indeterminate = progress === undefined;
  const {
    phaseDuration,
    phaseEasing = Easing.linear,
    rotationDuration,
    initialPhase = 0,
    getArc,
  } = behavior;

  useEffect(() => {
    if (indeterminate) {
      if (rotationDuration !== null) {
        rotation.value = withRepeat(
          withTiming(360, {
            duration: rotationDuration,
            easing: Easing.linear,
          }),
          -1,
          false,
        );
      }

      if (initialPhase > 0) {
        // Первый цикл — с заданной фазы (бесшовный вход), дальше — полный
        // цикл. Запуск цикла продублирован в колбэке намеренно: колбэк
        // выполняется на UI-потоке, JS-замыкания оттуда вызывать нельзя.
        phase.value = initialPhase;
        phase.value = withTiming(
          1,
          {
            duration: phaseDuration * (1 - initialPhase),
            easing: phaseEasing,
          },
          finished => {
            if (finished) {
              phase.value = 0;
              phase.value = withRepeat(
                withTiming(1, { duration: phaseDuration, easing: phaseEasing }),
                -1,
                false,
              );
            }
          },
        );
      } else {
        phase.value = withRepeat(
          withTiming(1, { duration: phaseDuration, easing: phaseEasing }),
          -1,
          false,
        );
      }
    } else {
      cancelAnimation(rotation);
      cancelAnimation(phase);
      rotation.value = 0;
      phase.value = 0;
    }

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(phase);
    };
  }, [
    indeterminate,
    phaseDuration,
    phaseEasing,
    rotationDuration,
    initialPhase,
    rotation,
    phase,
  ]);

  const containerStyle = useAnimatedStyle(() => ({
    // Базовая ориентация — от верхней точки (-90°) в обоих режимах:
    // переключение determinate ↔ indeterminate не прыгает по углу.
    transform: [
      {
        rotate: `${(indeterminate ? rotation.value : 0) - 90}deg`,
      },
    ],
  }));

  const arcProps = useAnimatedProps(() => {
    if (!indeterminate) {
      const value =
        progress === undefined
          ? 0
          : typeof progress === "number"
            ? progress
            : progress.value;

      return {
        strokeDasharray: `${circumference} ${circumference}`,
        strokeDashoffset: circumference * (1 - clamp01(value)),
      };
    }

    const arc = getArc(phase.value);

    return {
      strokeDasharray: `${arc.length * circumference} ${circumference}`,
      strokeDashoffset: -arc.offset * circumference,
    };
  }, [indeterminate, circumference, getArc]);

  return { containerStyle, arcProps };
};
