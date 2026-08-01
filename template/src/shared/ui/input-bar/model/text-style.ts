import { Platform, TextStyle } from "react-native";

/**
 * Базовый стиль текста — порт chatTextBase.
 *
 * Android добавляет includeFontPadding к каждой строке, что увеличивает
 * высоту текста на 4–6dp и ломает вёрстку с фиксированными размерами
 * из IInputBarLayout. Отключаем — метрики совпадают с iOS.
 */
export const inputTextBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;
