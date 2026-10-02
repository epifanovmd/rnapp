import type { TColorTheme } from "@shared/lib/theme";
import { createContext } from "react";
import type { ColorValue, ViewStyle } from "react-native";

/** Внешний вид панели — общий для `Navbar`, `HiddenBar`, `ImageBar`. */
export interface IBarAppearanceProps {
  /** Фон: токен темы или цвет. По умолчанию — фон экрана. */
  background?: keyof TColorTheme | ColorValue;
  /** Скругление нижних углов, px. */
  bottomRadius?: number;
}

/** Фон панели: токен темы → цвет, иначе цвет как есть, без него — фон экрана. */
export const resolveBarBackground = (
  background: IBarAppearanceProps["background"],
  colors: TColorTheme,
): ColorValue => {
  if (background === undefined) return colors.background;

  return typeof background === "string" && background in colors
    ? colors[background as keyof TColorTheme]
    : background;
};

/** Стиль скругления нижних углов (`undefined` — без скругления). */
export const bottomRadiusStyle = (radius?: number): ViewStyle | undefined =>
  radius
    ? { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }
    : undefined;

/**
 * Панель-поверхность (`HiddenBar`, `ImageBar`) уже рисует фон: вложенный
 * `Navbar` по умолчанию прозрачный, чтобы не перекрыть её фон и скругления.
 */
export const BarSurfaceContext = createContext(false);
