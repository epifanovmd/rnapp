import { createContext, useContext } from "react";

import { IInputBarLayout, INPUT_BAR_DEFAULT_LAYOUT } from "./input-bar-layout";
import { createInputBarStyles, IInputBarStyles } from "./input-bar-styles";
import { IInputBarTheme, INPUT_BAR_LIGHT_THEME } from "./input-bar-theme";

/**
 * Контекст панели ввода: тема, метрики, флаги и собранные по ним стили.
 * Чат подстраивается под этот контекст, а не наоборот — InputBar о chat-view
 * ничего не знает.
 */

export interface IInputBarFeatures {
  showAttachButton: boolean;
  showVoiceRecording: boolean;
}

export const INPUT_BAR_DEFAULT_FEATURES: IInputBarFeatures = {
  showAttachButton: true,
  showVoiceRecording: true,
};

export interface IInputBarContextValue {
  theme: IInputBarTheme;
  layout: IInputBarLayout;
  features: IInputBarFeatures;
  /** Готовые стили под текущую пару (тема, метрики). */
  styles: IInputBarStyles;
}

export const InputBarContext = createContext<IInputBarContextValue>({
  theme: INPUT_BAR_LIGHT_THEME,
  layout: INPUT_BAR_DEFAULT_LAYOUT,
  features: INPUT_BAR_DEFAULT_FEATURES,
  styles: createInputBarStyles(INPUT_BAR_LIGHT_THEME, INPUT_BAR_DEFAULT_LAYOUT),
});

export const useInputBarContext = () => useContext(InputBarContext);
