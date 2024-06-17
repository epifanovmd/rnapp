import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { PropsWithChildren, useEffect } from "react";
import { useColorScheme } from "react-native";

import { ThemeContext } from "./ThemeContext";
import { ITheme, IThemeContext } from "./types";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME,
  DEFAULT_LIGHT_THEME_ID,
} from "./variants";

const THEMES: { [key in string]: ITheme } = {
  [DEFAULT_LIGHT_THEME_ID]: DEFAULT_DARK_THEME,
  [DEFAULT_DARK_THEME_ID]: DEFAULT_LIGHT_THEME,
};

export const ThemeProvider = React.memo<PropsWithChildren>(props => {
  const [theme, setTheme] = React.useState<ITheme>(DEFAULT_LIGHT_THEME);
  const isDarkMode = useColorScheme() === "dark";

  const toggleThemeCallback = React.useCallback(() => {
    setTheme(currentTheme => {
      if (currentTheme!.id === DEFAULT_LIGHT_THEME_ID) {
        AsyncStorage.setItem("themeId", DEFAULT_LIGHT_THEME_ID);

        return DEFAULT_DARK_THEME;
      }
      if (currentTheme!.id === DEFAULT_DARK_THEME_ID) {
        AsyncStorage.setItem("themeId", DEFAULT_DARK_THEME_ID);

        return DEFAULT_LIGHT_THEME;
      }

      return currentTheme;
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("themeId").then(themeId => {
      if (themeId) {
        setTheme({ ...THEMES[themeId] });
      } else {
        setTheme(isDarkMode ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME);
        AsyncStorage.setItem(
          "themeId",
          isDarkMode ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID,
        );
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memoizedValue = React.useMemo(() => {
    const value: IThemeContext = {
      theme: theme,
      toggleTheme: toggleThemeCallback,
      isLight: theme.id === DEFAULT_LIGHT_THEME_ID,
      isDark: theme.id === DEFAULT_DARK_THEME_ID,
    };

    return value;
  }, [theme, toggleThemeCallback]);

  return (
    <ThemeContext.Provider value={memoizedValue}>
      {theme ? props.children : null}
    </ThemeContext.Provider>
  );
});
