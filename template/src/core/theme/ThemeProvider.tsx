import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { PropsWithChildren, useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";

import { ThemeContext } from "./ThemeContext";
import { ITheme, IThemeContext, TThemeName } from "./types";
import { DARK_THEME, DEFAULT_LIGHT_THEME } from "./variants";

const THEMES: { [key in TThemeName]: ITheme } = {
  Dark: DARK_THEME,
  Light: DEFAULT_LIGHT_THEME,
};

export const ThemeProvider = React.memo<PropsWithChildren>(props => {
  const [theme, setTheme] = React.useState<ITheme>(DEFAULT_LIGHT_THEME);
  const isDarkMode = useColorScheme() === "dark";

  const toggleThemeCallback = React.useCallback(() => {
    setTheme(currentTheme => {
      if (currentTheme!.name === "Light") {
        AsyncStorage.setItem("themeName", "Dark").then();

        return DARK_THEME;
      }
      if (currentTheme!.name === "Dark") {
        AsyncStorage.setItem("themeName", "Light").then();

        return DEFAULT_LIGHT_THEME;
      }

      return currentTheme;
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("themeName").then(themeName => {
      if (themeName) {
        setTheme({ ...THEMES[themeName as TThemeName] });
      } else {
        setTheme(isDarkMode ? DARK_THEME : DEFAULT_LIGHT_THEME);
        AsyncStorage.setItem("themeName", isDarkMode ? "Dark" : "Light").then();
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memoizedValue = React.useMemo(() => {
    const value: IThemeContext = {
      name: theme.name,
      colors: theme.colors,
      toggleTheme: toggleThemeCallback,
      isLight: theme.name === "Light",
      isDark: theme.name === "Dark",
    };

    return value;
  }, [theme, toggleThemeCallback]);

  return (
    <ThemeContext.Provider value={memoizedValue}>
      <StatusBar
        barStyle={memoizedValue.isDark ? "light-content" : "dark-content"}
      />
      {theme ? props.children : null}
    </ThemeContext.Provider>
  );
});
