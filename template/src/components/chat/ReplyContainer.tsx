import React, { FC, memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useChatTheme } from "./ChatThemeProvider";
import { MessageAudio, MessageAudioProps } from "./MessageAudio";
import { MessageImage, MessageImageProps } from "./MessageImage";
import { MessageVideo, MessageVideoProps } from "./MessageVideo";
import { IMessage } from "./types";

export interface ReplyContainerProps {
  replyMessage?: IMessage | null;

  onReset?: () => void;

  renderMessageImage?: (props: MessageImageProps) => React.ReactElement | null;
  renderMessageAudio?: (props: MessageAudioProps) => React.ReactElement | null;
  renderMessageVideo?: (props: MessageVideoProps) => React.ReactElement | null;
  renderResetReplyIcon?: () => React.ReactElement | null;
}

export const ReplyContainer: FC<ReplyContainerProps> = memo(
  ({
    replyMessage,
    onReset,
    renderMessageImage,
    renderMessageVideo,
    renderMessageAudio,
    renderResetReplyIcon,
  }) => {
    const theme = useChatTheme();

    if (!replyMessage) {
      return null;
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.toolbarReplyBackground,
          },
        ]}
      >
        <View
          style={[
            styles.message,
            {
              borderLeftColor: theme.replyBorder,
              backgroundColor: theme.replyBackground,
            },
          ]}
        >
          {(!!replyMessage.video &&
            renderMessageVideo?.({ currentMessage: replyMessage })) ?? (
            <MessageVideo currentMessage={replyMessage} />
          )}
          {(!!replyMessage.audio &&
            renderMessageAudio?.({ currentMessage: replyMessage })) ?? (
            <MessageAudio currentMessage={replyMessage} />
          )}
          {!!replyMessage.image &&
            (renderMessageImage?.({ currentMessage: replyMessage }) ?? (
              <MessageImage
                currentMessage={replyMessage}
                imageStyle={styles.image}
              />
            ))}
          <Text style={styles.text} numberOfLines={3}>
            {replyMessage.text}
          </Text>
        </View>
        <TouchableOpacity onPress={onReset} style={styles.icon}>
          {renderResetReplyIcon?.() ?? (
            <Svg height={24} width={24} viewBox="0 0 24 24">
              <Path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </Svg>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center" },
  message: {
    flexGrow: 1,
    flexShrink: 1,

    borderLeftWidth: 4,
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8,
    borderRadius: 4,
  },
  text: { padding: 8 },
  image: {
    height: 28,
    width: 32,
    borderRadius: 4,
  },
  icon: { alignSelf: "flex-start", marginTop: 8, marginRight: 8 },
});
