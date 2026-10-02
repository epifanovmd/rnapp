import type {
  TTabBarFit,
  TTabBarLabelPosition,
  TTabBarLabels,
} from "./tab-bar.types";

/** Ширина вкладки при `fit="hug"`: без подписей или только у активной / с подписями у всех, px. */
const HUG_ITEM_WIDTH = 56;
const HUG_LABELED_ITEM_WIDTH = 76;

/** Ширина вкладки при `fit="hug"`: заданная или по режиму подписей. */
export const hugItemWidth = (labels: TTabBarLabels, itemWidth?: number) =>
  itemWidth ?? (labels === "always" ? HUG_LABELED_ITEM_WIDTH : HUG_ITEM_WIDTH);

/** Наибольшая ширина подписи, px. */
const LABEL_MAX = 160;
/** Отступ подписи рядом с иконкой, px. */
const BESIDE_GAP = 6;

/*
 * Анимированный стиль не сбрасывает ключи, пропавшие из него, поэтому стили
 * ниже во всех режимах возвращают один и тот же набор ключей.
 */

/**
 * Размер вкладки (worklet): `fill` — доля ряда по весу (`flexGrow` от нулевой
 * ширины), `hug` — `weight × itemWidth`.
 */
export const tabSizeStyle = (
  weight: number,
  fit: TTabBarFit,
  itemWidth: number,
) => {
  "worklet";

  return fit === "fill"
    ? { flexGrow: weight, width: 0 }
    : { flexGrow: 0, width: weight * itemWidth };
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
