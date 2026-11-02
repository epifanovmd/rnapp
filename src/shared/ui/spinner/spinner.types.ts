import { ColorValue, StyleProp, ViewStyle } from "react-native";
import {
  EasingFunction,
  EasingFunctionFactory,
  SharedValue,
} from "react-native-reanimated";

/** Дуга в долях окружности (0..1). */
export interface ISpinnerArc {
  /** Длина дуги. */
  length: number;
  /** Смещение начала дуги по ходу вращения. */
  offset: number;
}

/**
 * Стратегия индетерминированного поведения спиннера (OCP: своё поведение —
 * это новый объект, компонент не меняется). `getArc` — worklet, вызывается
 * на UI-потоке каждый кадр фазы.
 */
export interface ISpinnerBehavior {
  /** Длительность цикла фазы 0..1, мс. */
  phaseDuration: number;
  phaseEasing?: EasingFunction | EasingFunctionFactory;
  /** Полный оборот контейнера, мс; null — без вращения. */
  rotationDuration: number | null;
  /**
   * Стартовая фаза первого цикла (0..1) — для бесшовного входа из другого
   * состояния (например, pull-to-refresh стартует с пика длины дуги).
   */
  initialPhase?: number;
  /** Worklet: дуга по фазе цикла. */
  getArc: (phase: number) => ISpinnerArc;
}

export interface ISpinnerProps {
  /** Диаметр, px. */
  size?: number;
  /** Цвет дуги; по умолчанию primary темы. */
  color?: ColorValue;
  /** Толщина дуги; по умолчанию ≈ size/8. */
  strokeWidth?: number;
  /**
   * Прогресс 0..1 (число или shared value) — детерминированная дуга от
   * верхней точки; `behavior` в этом режиме игнорируется.
   */
  progress?: SharedValue<number> | number;
  /** Поведение индетерминированного режима; по умолчанию «червяк». */
  behavior?: ISpinnerBehavior;
  style?: StyleProp<ViewStyle>;
}
