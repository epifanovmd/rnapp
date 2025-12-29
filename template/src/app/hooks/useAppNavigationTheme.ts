import { useTheme } from "@core";
import { DefaultTheme } from "@react-navigation/native";
import { useMemo } from "react";

export const useAppNavigationTheme = () => {
  const { colors } = useTheme();

  return useMemo<ReactNavigation.Theme>(() => {
    return {
      dark: true, // Обратите внимание: если используете обе темы, нужно сделать это динамическим
      colors: {
        primary: colors.blue500,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.slate400,
        notification: colors.red500,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [
    colors.blue500,
    colors.background,
    colors.surface,
    colors.textPrimary,
    colors.slate400,
    colors.red500,
  ]);
};
