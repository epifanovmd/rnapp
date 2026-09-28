import { DefaultTheme } from "@react-navigation/native";
import { useTheme } from "@shared/lib/theme";
import { useMemo } from "react";

export const useAppNavigationTheme = () => {
  const { colors, isDark } = useTheme();

  return useMemo<ReactNavigation.Theme>(() => {
    return {
      dark: isDark,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.danger,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [colors, isDark]);
};
