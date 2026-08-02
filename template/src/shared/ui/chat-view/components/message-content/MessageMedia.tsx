import React, { FC } from "react";
import { View } from "react-native";

import { IParsedChatMessage } from "../../data";
import { useChatViewContext } from "../chat-view-context";
import {
  FileContent,
  MediaGridContent,
  PollContent,
  VoiceContent,
} from "../content";

/** Медиа-часть сообщения; текст рисуется отдельно, ниже. */

interface IMessageMediaProps {
  message: IParsedChatMessage;
  /** Доступная ширина внутри пузыря — по ней верстается сетка вложений. */
  innerWidth: number;
}

export const MessageMedia: FC<IMessageMediaProps> = ({
  message,
  innerWidth,
}) => {
  const { styles } = useChatViewContext();
  const media = message.body.media;

  if (!media) return null;

  switch (media.type) {
    case "images":
      return (
        <MediaGridContent
          messageId={message.id}
          media={media.items}
          width={innerWidth}
        />
      );

    case "voice":
      return (
        <VoiceContent
          url={media.url}
          duration={media.duration}
          waveform={media.waveform}
          ownership={message.ownership}
        />
      );

    case "poll":
      return (
        <PollContent
          messageId={message.id}
          poll={media.poll}
          ownership={message.ownership}
        />
      );

    case "files":
      return (
        <View style={styles.shared.fileList}>
          {media.items.map((file, i) => (
            <FileContent
              key={`${file.url}_${i}`}
              messageId={message.id}
              file={file}
              ownership={message.ownership}
            />
          ))}
        </View>
      );
  }
};
