import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatFileSize } from "../../model";
import { ChatFileItem, ChatMessageOwnership } from "../../types";
import { useChatViewContext } from "../chat-view-context";
import { ChatIcon, ChatIconName } from "../ChatIcon";

/**
 * Порт FileContentView: карточка файла с иконкой по расширению,
 * именем (обрезка) и размером.
 */

const iconForFile = (name: string): ChatIconName => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
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
    const { theme, layout, delegate } = useChatViewContext();
    const isOutgoing = ownership === "mine";
    const pad = layout.filePadding;

    return (
      <Pressable
        style={[
          ss.card,
          {
            minHeight: layout.fileIconSize + pad * 2,
            borderRadius: layout.fileCornerRadius,
            backgroundColor: isOutgoing
              ? theme.outgoingFileBackground
              : theme.incomingFileBackground,
            padding: pad,
          },
        ]}
        onPress={() => delegate.current?.onTapMessage(messageId)}
      >
        <View
          style={[
            ss.iconBox,
            { width: layout.fileIconSize, height: layout.fileIconSize },
          ]}
        >
          <ChatIcon
            name={iconForFile(file.name)}
            size={layout.fileIconPointSize + 6}
            color={isOutgoing ? theme.outgoingText : theme.fileIconColor}
          />
        </View>
        <View style={[ss.info, { marginLeft: layout.fileContentSpacing }]}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{
              fontSize: layout.fileNameFont.fontSize,
              fontWeight: layout.fileNameFont.fontWeight,
              color: isOutgoing ? theme.outgoingText : theme.incomingText,
            }}
          >
            {file.name}
          </Text>
          <Text
            style={[
              ss.size,
              {
                fontSize: layout.fileSizeFont.fontSize,
                fontWeight: layout.fileSizeFont.fontWeight,
                color: isOutgoing ? theme.outgoingTime : theme.incomingTime,
              },
            ]}
          >
            {formatFileSize(file.size)}
          </Text>
        </View>
      </Pressable>
    );
  },
);

FileContent.displayName = "FileContent";

const ss = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  size: {
    marginTop: 1,
  },
});
