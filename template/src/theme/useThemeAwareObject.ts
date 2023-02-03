// ThemeAwareObject.hook.tsx
import React from 'react';
import {Theme} from './interface';
import {useTheme} from './ThemeProvider';

// Create a type alias for our generator function
// Notice that it's matching the form of the 'createStyles'
// function which we've used previously
type Generator<T extends {}> = (theme: Theme) => T;
// Creating our custom hook
const useThemeAwareObject = <T extends {}>(fn: Generator<T>) => {
  // Consume the provided value of our theme context
  const {theme} = useTheme();
  // Generate the object based on the current theme
  // We're using the React.useMemo hook for optimization,
  // the object will be re-generated if the theme changes
  // or the generator function reference changes
  const ThemeAwareObject = React.useMemo(() => fn(theme), [fn, theme]);

  return ThemeAwareObject;
};

export {useThemeAwareObject};
