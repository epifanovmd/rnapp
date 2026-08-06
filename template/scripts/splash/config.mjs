import { existsSync } from "node:fs";

import { fromRoot } from "./paths.mjs";

/**
 * Слот иконки Android 12+: система рисует логотип в квадрате 288dp, растягивая
 * картинку до его размера. Тот же слот использует `drawable/splash_compat.xml`
 * для Android < 12, поэтому холст всегда квадратный.
 */
const ANDROID_ICON_SLOT_DP = 288;

const DEFAULTS = {
  platforms: ["android", "ios"],
  logo: { width: 100 },
  brand: { width: 160, slotWidth: 200, slotHeight: 80 },
  android: {
    resPath: "android/app/src/main/res",
    names: {
      logo: "splash_logo",
      brand: "splash_brand",
      background: "splash_background",
    },
  },
  ios: {
    projectPath: "ios",
    storyboardName: "Splash",
    brandBottom: 60,
    logoOffsetY: 0,
    names: {
      logo: "SplashLogo",
      brand: "SplashBrand",
      background: "SplashBackground",
    },
  },
};

/** Приводит пользовательский конфиг к виду, в котором нет незаданных полей. */
const normalize = config => ({
  ...config,
  platforms: config.platforms ?? DEFAULTS.platforms,
  logo: {
    width: config.logo?.width ?? DEFAULTS.logo.width,
    slot: { width: ANDROID_ICON_SLOT_DP, height: ANDROID_ICON_SLOT_DP },
  },
  brand: {
    width: config.brand?.width ?? DEFAULTS.brand.width,
    slot: {
      width: config.brand?.slotWidth ?? DEFAULTS.brand.slotWidth,
      height: config.brand?.slotHeight ?? DEFAULTS.brand.slotHeight,
    },
  },
  android: {
    ...DEFAULTS.android,
    ...config.android,
    names: { ...DEFAULTS.android.names, ...config.android?.names },
  },
  ios: {
    ...DEFAULTS.ios,
    ...config.ios,
    names: { ...DEFAULTS.ios.names, ...config.ios?.names },
  },
});

/** Загружает конфиг по пути из аргумента или `splash.config.mjs` в корне. */
export const loadConfig = async path => {
  const configPath = fromRoot(path ?? "splash.config.mjs");

  if (!existsSync(configPath)) {
    throw new Error(`Нет файла конфигурации: ${configPath}`);
  }

  const { default: config } = await import(configPath);

  if (!config?.light) {
    throw new Error("В конфиге не задана секция light");
  }

  return normalize(config);
};
