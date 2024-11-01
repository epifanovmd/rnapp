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
  replyWrapperStyle?: LeftRightStyle<ViewStyle>;
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
    replyWrapperStyle,
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

  const _onPress = useCallback(() => {
    if (onPress) {
      onPress(currentMessage);
    }
  }, [currentMessage, onPress]);

  const _onLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(currentMessage);
    } else if (currentMessage && currentMessage.text) {
      // Long press action
    }
  }, [currentMessage, onLongPress]);

  const styledBubbleToNext = useCallback(() => {
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
  }, [containerToNextStyle, currentMessage, nextMessage, position]);

  const styledBubbleToPrevious = useCallback(() => {
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
  }, [containerToPreviousStyle, currentMessage, position, previousMessage]);

  const _renderMessageText = useCallback(() => {
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
  }, [
    currentMessage,
    parsePatterns,
    position,
    renderMessageText,
    reply,
    textStyle,
  ]);

  const _renderMessageImage = useCallback(() => {
    if (currentMessage && currentMessage.image) {
      const messageImageProps: MessageImageProps = {
        currentMessage,
        imageProps,
        imageStyle,
        imageViewingProps,
      };

      if (renderMessageImage) {
        return renderMessageImage(messageImageProps);
      }

      return (
        <MessageImage
          {...messageImageProps}
          imageStyle={messageImageProps.imageStyle}
        />
      );
    }

    return null;
  }, [
    currentMessage,
    imageProps,
    imageStyle,
    imageViewingProps,
    renderMessageImage,
  ]);

  const _renderMessageVideo = useCallback(() => {
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
  }, [currentMessage, renderMessageVideo]);

  const _renderMessageAudio = useCallback(() => {
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
  }, [currentMessage, renderMessageAudio]);

  const _renderTicks = useCallback(() => {
    if (renderTicks && currentMessage) {
      return renderTicks(currentMessage);
    }
    if (
      currentMessage &&
      user &&
      currentMessage.user &&
      currentMessage.user.id !== user.id
    ) {
      return null;
    }
    if (
      currentMessage &&
      (currentMessage.sent || currentMessage.received || currentMessage.pending)
    ) {
      return (
        <View style={styles.content.tickView}>
          {!!currentMessage.sent && (
            <Text
              style={[
                styles.content.tick,
                {
                  color:
                    theme[`${position}TickColor`] ??
                    theme[`${position}BubbleInfoColor`],
                },
                tickStyle,
              ]}
            >
              ✓
            </Text>
          )}
          {!!currentMessage.received && (
            <Text
              style={[
                styles.content.tick,
                {
                  marginLeft: -5,
                  color:
                    theme[`${position}TickColor`] ??
                    theme[`${position}BubbleInfoColor`],
                },
                tickStyle,
              ]}
            >
              ✓
            </Text>
          )}
          {!!currentMessage.pending && (
            <Text
              style={[
                styles.content.tick,
                {
                  backgroundColor:
                    theme[`${position}TickBackground`] ??
                    theme[`${position}BubbleBackground`],
                },
                {
                  color:
                    theme[`${position}TickColor`] ??
                    theme[`${position}BubbleInfoColor`],
                },
                tickStyle,
              ]}
            >
              🕓
            </Text>
          )}
        </View>
      );
    }

    return null;
  }, [currentMessage, position, renderTicks, theme, tickStyle, user]);

  const _renderTime = useCallback(() => {
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
  }, [currentMessage, position, renderTime, timeFormat, timeTextStyle]);

  const _renderUsername = useCallback(() => {
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
            style={
              [
                styles.content.username,
                { color: theme[`${position}UsernameColor`] },
                usernameStyle,
              ] as TextStyle
            }
          >
            ~ {currentMessage.user.name}
          </Text>
        </View>
      );
    }

    return null;
  }, [
    currentMessage,
    position,
    renderUsername,
    showUsernameOnMessage,
    theme,
    user,
    usernameStyle,
  ]);

  const renderBubbleContent = useCallback(() => {
    return (
      <View>
        {_renderMessageImage()}
        {_renderMessageVideo()}
        {_renderMessageAudio()}
        {_renderMessageText()}
      </View>
    );
  }, [
    _renderMessageAudio,
    _renderMessageImage,
    _renderMessageText,
    _renderMessageVideo,
  ]);

  const _containerStyle = useMemo(
    () => [
      styles[position].container,
      containerStyle && containerStyle[position],
    ],
    [containerStyle, position],
  );

  const wrapStyle: StyleProp<ViewStyle> = useMemo(
    () => [
      styles[position].wrapper,
      {
        backgroundColor: theme[`${position}BubbleBackground`],
      },
      styledBubbleToNext(),
      styledBubbleToPrevious(),
      wrapperStyle && wrapperStyle[position],
      reply
        ? ([
            {
              borderLeftColor: theme.replyBorder,
              borderLeftWidth: 4,
              marginTop: 8,
              marginLeft: 8,
              marginRight: 8,
              borderRadius: 4,
              backgroundColor: theme.replyBackground,
            },
            replyWrapperStyle,
          ] as StyleProp<ViewStyle>)
        : [],
    ],
    [
      replyWrapperStyle,
      position,
      reply,
      styledBubbleToNext,
      styledBubbleToPrevious,
      theme,
      wrapperStyle,
    ],
  );

  const bottomStyle = useMemo(
    () => [
      styles[position].bottom,
      bottomContainerStyle && bottomContainerStyle[position],
    ],
    [bottomContainerStyle, position],
  );

  return (
    <View style={_containerStyle}>
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
          {renderBubbleContent()}
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
