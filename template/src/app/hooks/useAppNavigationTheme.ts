import { useTheme } from "@core";
import { DefaultTheme } from "@react-navigation/native";
import { useMemo } from "react";

export const useAppNavigationTheme = () => {
  const { colors } = useTheme();

  return useMemo<ReactNavigation.Theme>(() => {
    return {
      dark: true,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.red,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [
    colors.primary,
    colors.background,
    colors.surface,
    colors.textPrimary,
    colors.border,
    colors.red,
  ]);
};
