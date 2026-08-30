import { getTextStyle } from "@shared/ui";
import React, { FC, memo } from "react";
import { Text } from "react-native";

import { MessageContentOf } from "../../model/message.types";
import { IMessageColors } from "../useMessageColors";

export interface ITextMessageContentProps {
  content: MessageContentOf<"text">;
  colors: IMessageColors;
}

/** Текстовое сообщение. */
export const TextMessageContent: FC<ITextMessageContentProps> = memo(
  ({ content, colors }) => (
    <Text style={[getTextStyle("Body_S2"), { color: colors.text }]}>
      {content.text}
    </Text>
  ),
);

TextMessageContent.displayName = "TextMessageContent";
