import React, {useEffect} from 'react';
import {log} from '../service';
import {Theme} from './interface';
import {
  DEFAULT_DARK_THEME,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME,
  DEFAULT_LIGHT_THEME_ID,
} from './variants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';

interface ProvidedValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

const Context = React.createContext<ProvidedValue>({
  theme: DEFAULT_LIGHT_THEME,
  toggleTheme: () => {
    log.error('ThemeProvider is not rendered!');
  },
  isDark: false,
  isLight: true,
});

interface Props {
  children?: React.ReactNode;
}

const THEMES: {[key in string]: Theme} = {
  [DEFAULT_LIGHT_THEME_ID]: DEFAULT_DARK_THEME,
  [DEFAULT_DARK_THEME_ID]: DEFAULT_LIGHT_THEME,
};

export const ThemeProvider = React.memo<Props>(props => {
  const [theme, setTheme] = React.useState<Theme | undefined>(undefined);
  const isDarkMode = useColorScheme() === 'dark';

  const toggleThemeCallback = React.useCallback(() => {
    setTheme(currentTheme => {
      if (currentTheme!.id === DEFAULT_LIGHT_THEME_ID) {
        AsyncStorage.setItem('themeId', DEFAULT_LIGHT_THEME_ID);

        return DEFAULT_DARK_THEME;
      }
      if (currentTheme!.id === DEFAULT_DARK_THEME_ID) {
        AsyncStorage.setItem('themeId', DEFAULT_DARK_THEME_ID);

        return DEFAULT_LIGHT_THEME;
      }

      return currentTheme;
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('themeId').then(themeId => {
      if (themeId) {
        setTheme({...THEMES[themeId]});
      } else {
        setTheme(isDarkMode ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME);
        AsyncStorage.setItem(
          'themeId',
          isDarkMode ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID,
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memoizedValue = React.useMemo(() => {
    const value: ProvidedValue = {
      theme: theme!,
      toggleTheme: toggleThemeCallback,
      isLight: theme?.id === DEFAULT_LIGHT_THEME_ID,
      isDark: theme?.id === DEFAULT_DARK_THEME_ID,
    };

    return value;
  }, [theme, toggleThemeCallback]);

  return (
    <Context.Provider value={memoizedValue}>
      {theme ? props.children : null}
    </Context.Provider>
  );
});

export const useTheme = () => React.useContext(Context);
