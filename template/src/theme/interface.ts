import {
  DEFAULT_LIGHT_COLOR_THEME,
  DEFAULT_LIGHT_SPACING_THEME,
} from './variants';
import {StatusBarStyle} from 'react-native/Libraries/Components/StatusBar/StatusBar';

export type ColorTheme = typeof DEFAULT_LIGHT_COLOR_THEME & {
  barStyle: string | StatusBarStyle;
};

export type SpacingTheme = typeof DEFAULT_LIGHT_SPACING_THEME & {};

export interface Theme {
  id: string;
  color: ColorTheme;
  spacing: SpacingTheme;
}
