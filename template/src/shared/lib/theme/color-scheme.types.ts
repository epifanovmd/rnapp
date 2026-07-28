import { createInjectDecorator } from "@shared/lib/di";

import { TThemeName } from "./types";

/**
 * Абстракция над определением предпочитаемой ОС цветовой схемы.
 * React Native: Appearance (не хук useColorScheme — сервис должен работать вне React).
 */
export const IColorSchemeProvider =
  createInjectDecorator<IColorSchemeProvider>();

export interface IColorSchemeProvider {
  getPreferredScheme(): TThemeName;
  onSchemeChange(callback: (scheme: TThemeName) => void): () => void;
}
