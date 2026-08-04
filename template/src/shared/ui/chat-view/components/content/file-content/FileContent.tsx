import React, { FC, memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useChatViewContext } from "../../../model";
import { ChatFileItem, ChatMessageOwnership } from "../../../types";
import { formatFileSize } from "../../../utils";
import { ChatIcon, ChatIconName } from "../../ChatIcon";
import { ChatText } from "../../ChatText";

/**
 * Карточка файла: иконка по расширению, имя с обрезкой посередине и размер.
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
  file: ChatFileItem;
  /** Позиция файла в сообщении — уходит в событие тапа. */
  index: number;
  ownership: ChatMessageOwnership;
  onPress: (index: number) => void;
}

export const FileContent: FC<IFileContentProps> = memo(
  ({ file, index, ownership, onPress }) => {
    const { layout, styles } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const handlePress = useCallback(() => onPress(index), [onPress, index]);

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
          <ChatText numberOfLines={1} ellipsizeMode="middle" style={s.fileName}>
            {file.name}
          </ChatText>
          <ChatText style={s.fileSize}>{formatFileSize(file.size)}</ChatText>
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
