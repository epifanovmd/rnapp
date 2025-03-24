import { ImageViewingProps } from "@force-dev/react-mobile";
import React, { FC, memo, useCallback, useMemo } from "react";
import {
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native";
import { ParsedTextProps } from "react-native-parsed-text";

import { useChatTheme } from "./ChatThemeProvider";
import { MessageAudio, MessageAudioProps } from "./MessageAudio";
import { MessageImage, MessageImageProps } from "./MessageImage";
import { MessageText, MessageTextProps } from "./MessageText";
import { MessageVideo, MessageVideoProps } from "./MessageVideo";
import { Time, TimeProps } from "./Time";
import { IMessage, LeftRightStyle, User } from "./types";
import { isSameDay, isSameUser } from "./utils";

export interface BubbleProps {
  user?: User;
  currentMessage: IMessage;
  nextMessage?: IMessage;
  previousMessage?: IMessage;

  // Settings
  position: "left" | "right";
  touchableProps?: TouchableOpacityProps;
  showUsernameOnMessage?: boolean;
  reply?: boolean;

  // Styles
  containerStyle?: LeftRightStyle<ViewStyle>;
  wrapperStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  bottomContainerStyle?: LeftRightStyle<ViewStyle>;
  tickStyle?: StyleProp<TextStyle>;
  containerToNextStyle?: LeftRightStyle<ViewStyle>;
  containerToPreviousStyle?: LeftRightStyle<ViewStyle>;
  usernameStyle?: TextStyle;

  // Text
  parsePatterns?: (linkStyle: StyleProp<TextStyle>) => ParsedTextProps["parse"];

  // Image
  imageProps?: Partial<ImageProps>;
  imageStyle?: StyleProp<ImageStyle>;
  imageViewingProps?: ImageViewingProps;

  // Time
  timeFormat?: string;
  timeTextStyle?: LeftRightStyle<TextStyle>;

  // Handlers
  onPress?: (message: IMessage) => void;
  onLongPress?: (message: IMessage) => void;
  onReply?: (message: IMessage) => void;

  // Renders
  renderMessageImage?: (props: MessageImageProps) => React.ReactElement | null;
  renderMessageVideo?: (props: MessageVideoProps) => React.ReactElement | null;
  renderMessageAudio?: (props: MessageAudioProps) => React.ReactElement | null;
  renderMessageText?: (props: MessageTextProps) => React.ReactElement | null;
  renderTime?: (timeProps: TimeProps) => React.ReactElement | null;
  renderTicks?: (currentMessage: IMessage) => React.ReactElement | null;
  renderUsername?: (user: User) => React.ReactElement | null;
}

export const Bubble: FC<BubbleProps> = memo(props => {
  const {
    user,
    currentMessage,
    nextMessage,
    previousMessage,
    position = "left",
    touchableProps,
    showUsernameOnMessage,
    reply,
    containerStyle,
    wrapperStyle,
    textStyle,
    bottomContainerStyle,
    tickStyle,
    containerToNextStyle,
    containerToPreviousStyle,
    usernameStyle,
    parsePatterns,
    imageProps,
    imageStyle,
    imageViewingProps,
    timeFormat,
    timeTextStyle,
    onPress,
    onLongPress,
    renderMessageImage,
    renderMessageVideo,
    renderMessageAudio,
    renderMessageText,
    renderTime,
    renderTicks,
    renderUsername,
  } = props;

  const theme = useChatTheme();

  const _onPress = onPress ? () => onPress(currentMessage) : undefined;
  const _onLongPress = onLongPress
    ? () => onLongPress(currentMessage)
    : undefined;

  const styledBubbleToNext = () => {
    if (
      currentMessage &&
      nextMessage &&
      position &&
      isSameUser(currentMessage, nextMessage) &&
      isSameDay(currentMessage, nextMessage)
    ) {
      return [
        styles[position].containerToNext,
        containerToNextStyle && containerToNextStyle[position],
      ];
    }

    return null;
  };

  const styledBubbleToPrevious = () => {
    if (
      currentMessage &&
      previousMessage &&
      position &&
      isSameUser(currentMessage, previousMessage) &&
      isSameDay(currentMessage, previousMessage)
    ) {
      return [
        styles[position].containerToPrevious,
        containerToPreviousStyle && containerToPreviousStyle[position],
      ];
    }

    return null;
  };

  const _renderMessageText = () => {
    if (currentMessage && currentMessage.text) {
      const messageTextProps: MessageTextProps = {
        currentMessage,
        textStyle,
        position,
        parsePatterns,
      };

      if (renderMessageText) {
        return renderMessageText(messageTextProps);
      }

      return (
        <MessageText
          {...messageTextProps}
          numberOfLines={reply ? 3 : undefined}
        />
      );
    }

    return null;
  };

  const _renderMessageImage = () =>
    currentMessage?.image &&
    (renderMessageImage ? (
      renderMessageImage({
        currentMessage,
        imageProps,
        imageStyle,
        imageViewingProps,
      })
    ) : (
      <MessageImage
        currentMessage={currentMessage}
        imageProps={imageProps}
        imageStyle={imageStyle}
        imageViewingProps={imageViewingProps}
      />
    ));

  const _renderMessageVideo = () => {
    if (currentMessage && currentMessage.video) {
      const messageVideoProps: MessageVideoProps = {
        currentMessage,
      };

      if (renderMessageVideo) {
        return renderMessageVideo(messageVideoProps);
      }

      return <MessageVideo {...messageVideoProps} />;
    }

    return null;
  };

  const _renderMessageAudio = () => {
    if (currentMessage && currentMessage.audio) {
      const messageAudioProps: MessageAudioProps = {
        currentMessage,
      };

      if (renderMessageAudio) {
        return renderMessageAudio(messageAudioProps);
      }

      return <MessageAudio {...messageAudioProps} />;
    }

    return null;
  };

  const _renderTicks = () => {
    if (!currentMessage || (user && currentMessage.user.id !== user.id))
      return null;

    if (renderTicks && currentMessage) {
      return renderTicks(currentMessage);
    }

    return (
      <View style={styles.content.tickView}>
        {currentMessage.sent && (
          <Text
            style={[
              styles.content.tick,
              { color: theme[`${position}TickColor`] },
              tickStyle,
            ]}
          >
            ✓
          </Text>
        )}
        {currentMessage.received && (
          <Text
            style={[
              styles.content.tick,
              { marginLeft: -5, color: theme[`${position}TickColor`] },
              tickStyle,
            ]}
          >
            ✓
          </Text>
        )}
        {currentMessage.pending && (
          <Text
            style={[
              styles.content.tick,
              { backgroundColor: theme[`${position}TickBackground`] },
              tickStyle,
            ]}
          >
            🕓
          </Text>
        )}
      </View>
    );
  };

  const _renderTime = () => {
    if (currentMessage && currentMessage.createdAt) {
      const timeProps: TimeProps = {
        currentMessage,
        timeFormat,
        position,
        timeTextStyle,
      };

      if (renderTime) {
        return renderTime(timeProps);
      }

      return <Time {...timeProps} />;
    }

    return null;
  };

  const _renderUsername = () => {
    if (showUsernameOnMessage && currentMessage) {
      if (user && currentMessage.user.id === user.id) {
        return null;
      }
      if (renderUsername) {
        return renderUsername(currentMessage.user);
      }

      return (
        <View style={styles.content.usernameView}>
          <Text
            style={[
              styles.content.username,
              { color: theme[`${position}UsernameColor`] },
              usernameStyle,
            ]}
          >
            ~ {currentMessage.user.name}
          </Text>
        </View>
      );
    }

    return null;
  };

  const wrapStyle = [
    styles[position].wrapper,
    { backgroundColor: theme[`${position}BubbleBackground`] },
    styledBubbleToNext(),
    styledBubbleToPrevious(),
    wrapperStyle?.[position],
    reply && {
      borderLeftColor: theme.replyBorder,
      borderLeftWidth: 4,
      marginTop: 8,
      marginLeft: 8,
      marginRight: 8,
      borderRadius: 4,
      backgroundColor: theme.replyBackground,
    },
  ];

  const bottomStyle = useMemo(
    () => [
      styles[position].bottom,
      bottomContainerStyle && bottomContainerStyle[position],
    ],
    [bottomContainerStyle, position],
  );

  return (
    <View style={[styles[position].container, containerStyle?.[position]]}>
      <TouchableOpacity
        onPress={_onPress}
        onLongPress={_onLongPress}
        disabled={!onPress && !onLongPress}
        delayLongPress={300}
        {...touchableProps}
      >
        <View style={wrapStyle}>
          {!reply && user && currentMessage.reply && (
            <Bubble {...props} reply currentMessage={currentMessage.reply} />
          )}
          {[
            _renderMessageImage(),
            _renderMessageVideo(),
            _renderMessageAudio(),
            _renderMessageText(),
          ].filter(Boolean)}
          {!reply && (
            <View style={bottomStyle}>
              {_renderUsername()}
              <View style={ss.row}>
                {_renderTime()}
                {_renderTicks()}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

const ss = StyleSheet.create({
  row: { flexDirection: "row", marginLeft: "auto" },
});

const styles = {
  left: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "flex-start",
    },
    wrapper: {
      borderRadius: 15,
      minHeight: 20,
      justifyContent: "flex-end",
    },
    containerToNext: {
      borderBottomLeftRadius: 3,
    },
    containerToPrevious: {
      borderTopLeftRadius: 3,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
  }),
  right: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "flex-end",
    },
    wrapper: {
      borderRadius: 15,
      minHeight: 20,
      justifyContent: "flex-end",
    },
    containerToNext: {
      borderBottomRightRadius: 3,
    },
    containerToPrevious: {
      borderTopRightRadius: 3,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  }),
  content: StyleSheet.create({
    tick: {
      fontSize: 10,
    },
    tickView: {
      flexDirection: "row",
      marginRight: 10,
    },
    username: {
      top: -3,
      left: 0,
      fontSize: 12,
    },
    usernameView: {
      flexDirection: "row",
      marginHorizontal: 10,
    },
  }),
};
