import type { ViewStyle } from "react-native";

type TTransform = NonNullable<ViewStyle["transform"]>;
type TTransformList = Exclude<TTransform, string>;

const EMPTY_TRANSFORM: TTransformList = [];

/**
 * Отделяет `opacity` и `transform` от остального стиля. Touchable анимирует
 * их через Reanimated, а анимированный проп перебивает статический стиль,
 * поэтому базовые значения нужно вплести в анимацию, а не класть рядом.
 * `transform` строкой (CSS-синтаксис) не поддерживается.
 */
export const splitAnimatedStyle = (
  style: ViewStyle,
): {
  baseOpacity: number;
  baseTransform: TTransformList;
  style: ViewStyle;
} => {
  const { opacity, transform, ...rest } = style;
  const parsed = typeof opacity === "number" ? opacity : Number(opacity);

  return {
    baseOpacity: opacity === undefined || Number.isNaN(parsed) ? 1 : parsed,
    baseTransform: Array.isArray(transform) ? transform : EMPTY_TRANSFORM,
    style: rest,
  };
};
