import { Platform, TextStyle } from "react-native";

/** Форматирование и базовый стиль текста панели ввода. */

/** Таймер записи «m:ss,cc». */
export const formatRecordTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds) % 60;
  const cs = Math.floor((seconds - Math.floor(seconds)) * 100);

  return `${m}:${s < 10 ? `0${s}` : s},${cs < 10 ? `0${cs}` : cs}`;
};

/**
 * Базовый стиль текста. Android добавляет к строке отступы шрифта, из-за чего
 * она выше на 4–6dp и ломает вёрстку с фиксированными размерами из layout.
 */
export const inputTextBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;
