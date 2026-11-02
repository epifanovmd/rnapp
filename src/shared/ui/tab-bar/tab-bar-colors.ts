import type { TColorTheme } from "@shared/lib/theme";

import type { TTabBarColor } from "./tab-bar.types";

/** Токен темы → цвет, иначе значение как есть. */
export const resolveTabBarColor = (
  color: TTabBarColor | undefined,
  colors: TColorTheme,
  fallback: keyof TColorTheme,
): string => {
  if (color === undefined) return colors[fallback];

  return typeof color === "string" && color in colors
    ? colors[color as keyof TColorTheme]
    : String(color);
};

/** Цвет `#RRGGBB` с прозрачностью; прочие форматы — как есть. */
export const withAlpha = (color: string, alpha: number): string => {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;

  const value = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");

  return `${color}${value}`;
};
