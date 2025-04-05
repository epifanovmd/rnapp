import { DefaultTheme } from "@react-navigation/native";
import { useTheme } from "@theme";
import { useMemo } from "react";

export const useAppNavigationTheme = () => {
  const { theme } = useTheme();

  return useMemo<ReactNavigation.Theme>(() => {
    return {
      dark: true,
      colors: {
        background: theme.color.background,
        text: theme.color.common.white,
        notification: "red",
        card: theme.color.grey.grey700,
        border: theme.color.grey.grey700,
        primary: theme.color.common.white,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [
    theme.color.background,
    theme.color.common.white,
    theme.color.grey.grey700,
  ]);
};
