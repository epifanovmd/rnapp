import React, { FC, memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChatFileItem, ChatMessageOwnership } from "../../types";
import { formatFileSize } from "../../utils";
import { useChatViewContext } from "../chat-view-context";
import { ChatIcon, ChatIconName } from "../ChatIcon";

/**
 * Карточка файла — порт `FileContentView`: иконка по расширению, имя с
 * обрезкой посередине и размер.
 */

const iconForFile = (name: string): ChatIconName => {
  switch (name.split(".").pop()?.toLowerCase()) {
    case "pdf":
      return "doc.richtext.fill";
    case "zip":
    case "rar":
    case "7z":
      return "doc.zipper";
    case "mp3":
    case "wav":
    case "aac":
    case "m4a":
      return "music.note";
    case "mp4":
    case "mov":
    case "avi":
      return "film";
    default:
      return "doc.fill";
  }
};

interface IFileContentProps {
  messageId: string;
  file: ChatFileItem;
  ownership: ChatMessageOwnership;
}

export const FileContent: FC<IFileContentProps> = memo(
  ({ messageId, file, ownership }) => {
    const { layout, styles, delegate } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const handlePress = useCallback(
      () => delegate.current?.onTapMessage(messageId),
      [delegate, messageId],
    );

    return (
      <Pressable style={s.fileCard} onPress={handlePress}>
        <View
          style={[
            ss.iconBox,
            { width: layout.fileIconSize, height: layout.fileIconSize },
          ]}
        >
          <ChatIcon
            name={iconForFile(file.name)}
            size={layout.fileIconPointSize + 6}
            color={s.fileIconColor}
          />
        </View>
        <View style={[ss.info, { marginLeft: layout.fileContentSpacing }]}>
          <Text numberOfLines={1} ellipsizeMode="middle" style={s.fileName}>
            {file.name}
          </Text>
          <Text style={s.fileSize}>{formatFileSize(file.size)}</Text>
        </View>
      </Pressable>
    );
  },
);

FileContent.displayName = "FileContent";

const ss = StyleSheet.create({
  iconBox: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
});
