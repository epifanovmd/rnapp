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
        text: colors.onSurfaceHigh,
        border: colors.border,
        notification: colors.alertError,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [
    colors.primary,
    colors.background,
    colors.surface,
    colors.onSurfaceHigh,
    colors.border,
    colors.alertError,
  ]);
};
