import { TColorTheme, useTheme } from "@shared/lib/theme";
import { useMemo } from "react";

/** Палитра одного сообщения: своё и чужое различаются только цветами. */
export interface IMessageColors {
  bubble: string;
  text: string;
  /** Автор, время, отметка о правке. */
  secondary: string;
  /** Полоса и автор цитаты. */
  accent: string;
  /** Подложка цитаты внутри пузыря. */
  quote: string;
}

const pick = (colors: TColorTheme, isOwn: boolean, isLight: boolean) =>
  isOwn
    ? {
        bubble: colors.primary,
        text: colors.primaryForeground,
        secondary: colors.blue100,
        accent: colors.primaryForeground,
        quote: isLight ? colors.blue600 : colors.blue700,
      }
    : {
        bubble: colors.onSurface,
        text: colors.textPrimary,
        secondary: colors.textSecondary,
        accent: colors.primary,
        quote: isLight ? colors.background : colors.slate800,
      };

/**
 * Цвета сообщения по признаку «своё». Единственное место, где решается, чем
 * своё сообщение отличается от чужого.
 *
 * Отдаёт готовые значения, а не имена токенов: строка списка перерисовывается
 * на каждой переработке контейнера, и разворачивать имена в цвета на каждый
 * рендер — работа на ровном месте.
 */
export const useMessageColors = (isOwn: boolean): IMessageColors => {
  const { colors, isLight } = useTheme();

  return useMemo(() => pick(colors, isOwn, isLight), [colors, isOwn, isLight]);
};
