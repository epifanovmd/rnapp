import React, { FC, memo, PropsWithChildren } from "react";
import { Text, TextStyle } from "react-native";

import { chatTextBase, IChatFont } from "../model";

/**
 * Текст с шрифтом из IChatViewLayout (размер/насыщенность/табличные цифры).
 */

interface IChatTextProps {
  font: IChatFont;
  color: string;
  numberOfLines?: number;
  align?: TextStyle["textAlign"];
}

export const ChatText: FC<PropsWithChildren<IChatTextProps>> = memo(
  ({ font, color, numberOfLines, align, children }) => (
    <Text
      numberOfLines={numberOfLines}
      style={[
        chatTextBase,
        {
          fontSize: font.fontSize,
          fontWeight: font.fontWeight,
          color,
          textAlign: align,
          ...(font.monospacedDigits ? { fontVariant: ["tabular-nums"] } : null),
        },
      ]}
    >
      {children}
    </Text>
  ),
);

ChatText.displayName = "ChatText";
