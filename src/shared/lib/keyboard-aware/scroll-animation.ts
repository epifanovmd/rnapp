/** Длительность докрутки к полю вне анимации клавиатуры, мс. */
export const SCROLL_ANIMATION_DURATION = 250;
/** Минимум на перенаправление уже идущей докрутки, мс. */
export const SCROLL_RETARGET_MIN_DURATION = 120;

export interface IScrollAnimationState {
  /** Докрутка уже идёт. */
  animating: boolean;
  /** Текущее положение скролла. */
  position: number;
  /** Цель идущей докрутки. */
  target: number;
  /** Новая цель. */
  nextTarget: number;
  /** Сколько осталось идущей докрутке, мс. */
  remaining: number;
}

export type TScrollAnimationPlan =
  | { action: "none" }
  | { action: "start" | "retarget"; from: number; duration: number };

/**
 * Одна плавная докрутка вместо нескольких: новая цель во время идущей
 * анимации (раскладка сдвинулась — ошибки формы, смена фокуса) не
 * перезапускает её с нуля, а перенаправляет с текущего места за остаток
 * времени. Та же цель или цель = положение — ничего.
 */
export const planScrollAnimation = ({
  animating,
  position,
  target,
  nextTarget,
  remaining,
}: IScrollAnimationState): TScrollAnimationPlan => {
  "worklet";

  if (animating) {
    if (Math.abs(nextTarget - target) < 0.5) return { action: "none" };

    return {
      action: "retarget",
      from: position,
      duration: Math.max(remaining, SCROLL_RETARGET_MIN_DURATION),
    };
  }

  if (Math.abs(nextTarget - position) < 0.5) return { action: "none" };

  return {
    action: "start",
    from: position,
    duration: SCROLL_ANIMATION_DURATION,
  };
};
