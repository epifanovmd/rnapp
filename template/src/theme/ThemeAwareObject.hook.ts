import React from 'react';
import {Theme} from './interface';
import {useTheme} from './ThemeProvider';

type Generator<T extends {}> = (theme: Theme) => T;

const useThemeAwareObject = <T extends {}>(fn: Generator<T>) => {
  const {theme} = useTheme();
  return React.useMemo(() => fn(theme), [fn, theme]);
};

export {useThemeAwareObject};
