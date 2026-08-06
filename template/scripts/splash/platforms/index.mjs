import { generateAndroid } from "./android.mjs";
import { generateIos } from "./ios.mjs";

/**
 * Реестр платформ: новая платформа добавляется своим модулем и записью здесь,
 * ядро генератора при этом не меняется.
 */
export const PLATFORM_WRITERS = {
  android: generateAndroid,
  ios: generateIos,
};
