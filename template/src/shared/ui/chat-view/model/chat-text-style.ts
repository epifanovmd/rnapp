import { Platform, TextStyle } from "react-native";

/**
 * Базовый стиль любого текста в чате.
 *
 * Порт свёрстан по iOS-метрикам (высоты цитаты, футера, чипов реакций взяты
 * из ChatLayout), а Android по умолчанию добавляет к каждой строке отступы
 * шрифта — строка становится выше на 4–6dp. В контейнерах фиксированной высоты
 * с `overflow: hidden` это обрезает текст (цитата теряла вторую строку), а в
 * остальных распирает пузырь. Отключаем — метрики совпадают с iOS.
 */
export const chatTextBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;
