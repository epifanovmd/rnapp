import { NativeModules } from "react-native";

interface AppSplashNativeModule {
  hide(fade: boolean): Promise<void>;
  isVisible(): Promise<boolean>;
}

const native = NativeModules.AppSplash as AppSplashNativeModule | undefined;

export interface HideSplashOptions {
  /** Плавное растворение вместо мгновенного скрытия. */
  fade?: boolean;
}

/**
 * Нативный splash-экран: держится поверх контента с запуска приложения и
 * убирается вручную, когда первый экран готов.
 */
export const AppSplash = {
  hide: ({ fade = false }: HideSplashOptions = {}): Promise<void> =>
    native?.hide(fade) ?? Promise.resolve(),

  isVisible: (): Promise<boolean> =>
    native?.isVisible() ?? Promise.resolve(false),
};
