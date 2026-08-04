import React, { FC, memo, useCallback } from "react";
import { View } from "react-native";

import { IChatContentProps, IChatFilesContent } from "../../../content";
import { useChatViewContext } from "../../../model";
import { FileContent } from "./FileContent";

/** Список файловых вложений сообщения. */

export const FilesContent: FC<IChatContentProps<IChatFilesContent>> = memo(
  ({ content, ownership, emit }) => {
    const { styles } = useChatViewContext();

    const handlePress = useCallback(
      (index: number) => emit("builtin.file.tap", { index }),
      [emit],
    );

    return (
      <View style={styles.shared.fileList}>
        {content.items.map((file, i) => (
          <FileContent
            key={`${file.url}_${i}`}
            file={file}
            index={i}
            ownership={ownership}
            onPress={handlePress}
          />
        ))}
      </View>
    );
  },
);

FilesContent.displayName = "FilesContent";
