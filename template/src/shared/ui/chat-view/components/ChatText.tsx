import React, { FC } from "react";
import { Text, TextProps } from "react-native";

/**
 * Текст чата — с выключенным масштабированием под системный размер шрифта.
 *
 * Кегли задаются метриками (`layout.messageFont` и соседние) в точках, и
 * нативная реализация берёт их буквально: `.systemFont(ofSize: 15)` не
 * участвует в Dynamic Type — ни `UIFontMetrics`, ни
 * `adjustsFontForContentSizeCategory` в поде нет.
 *
 * RN-овский `Text` по умолчанию масштабируется (`allowFontScaling: true`),
 * поэтому при системном размере, отличном от стандартного, две реализации
 * расходятся: меняется не только кегль, но и переносы строк, а за ними — высоты
 * ячеек. Выключаем, чтобы `layout` означал одно и то же на обеих платформах.
 *
 * Использовать вместо `Text` из `react-native` во всём чате.
 */
export const ChatText: FC<TextProps> = props => (
  <Text {...props} allowFontScaling={false} />
);

ChatText.displayName = "ChatText";
