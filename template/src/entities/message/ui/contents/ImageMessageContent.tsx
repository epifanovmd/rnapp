import { getTextStyle, Image } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MessageContentOf } from "../../model/message.types";
import { IMessageColors } from "../useMessageColors";

/** Высота картинки в пузыре; ширина тянется по пузырю. */
const IMAGE_HEIGHT = 160;

export interface IImageMessageContentProps {
  content: MessageContentOf<"image">;
  colors: IMessageColors;
}

/** Сообщение с картинкой и необязательной подписью. */
export const ImageMessageContent: FC<IImageMessageContentProps> = memo(
  ({ content, colors }) => (
    <View style={ss.container}>
      <Image url={content.url} height={IMAGE_HEIGHT} radius={12} />
      {content.caption && (
        <Text style={[getTextStyle("Body_S2"), { color: colors.text }]}>
          {content.caption}
        </Text>
      )}
    </View>
  ),
);

ImageMessageContent.displayName = "ImageMessageContent";

const ss = StyleSheet.create({
  container: { gap: 4 },
});
