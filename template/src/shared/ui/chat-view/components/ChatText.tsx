import React, { FC } from "react";
import { Text, TextProps } from "react-native";

/**
 * Текст чата с отключённым системным масштабированием шрифта.
 *
 * Кегли задаются метриками в точках. Чтобы высоты ячеек и переносы строк не
 * расходились между платформами, `allowFontScaling` выключен.
 */
export const ChatText: FC<TextProps> = props => (
  <Text {...props} allowFontScaling={false} />
);

ChatText.displayName = "ChatText";
