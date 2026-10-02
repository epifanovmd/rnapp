import type {
  TTabBarFit,
  TTabBarLabelPosition,
  TTabBarLabels,
} from "./tab-bar.types";

/** Наибольшая ширина подписи, px. */
const LABEL_MAX = 160;
/** Отступ подписи рядом с иконкой, px. */
const BESIDE_GAP = 6;

/*
 * Анимированный стиль не сбрасывает ключи, пропавшие из него: при смене
 * настроек прежний `flex` или `maxWidth` остался бы на вкладке. Поэтому
 * стили ниже во всех режимах возвращают один и тот же набор ключей.
 */

/** Размер вкладки (worklet): `fill` — доля ряда по весу, `hug` — `weight × itemWidth`. */
export const tabSizeStyle = (
  weight: number,
  fit: TTabBarFit,
  itemWidth: number,
) => {
  "worklet";

  return fit === "fill"
    ? { flexGrow: weight, flexShrink: 1, flexBasis: 0 }
    : { flexGrow: 0, flexShrink: 0, flexBasis: weight * itemWidth };
};

/**
 * Подпись вкладки (worklet): «только у активной» раскрывается вместе с
 * выбором, в остальных режимах видна целиком.
 */
export const tabLabelStyle = (
  position: number,
  index: number,
  labels: TTabBarLabels,
  labelPosition: TTabBarLabelPosition,
) => {
  "worklet";

  const visible =
    labels === "active" ? Math.max(0, 1 - Math.abs(position - index)) : 1;
  const beside = labelPosition === "beside";

  return {
    opacity: visible,
    maxWidth: beside ? LABEL_MAX * visible : LABEL_MAX,
    marginLeft: beside ? BESIDE_GAP * visible : 0,
  };
};
