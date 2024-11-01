import { isEqual } from "lodash";
import React, { FC, memo, useCallback, useMemo } from "react";
import {
  ColorValue,
  LayoutChangeEvent,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { Avatar, AvatarProps } from "./Avatar";
import { Bubble, BubbleProps } from "./Bubble";
import { Day, DayProps } from "./Day";
import { ReplySwipe } from "./ReplySwipe";
import { SystemMessage, SystemMessageProps } from "./SystemMessage";
import { IMessage, LeftRightStyle, User } from "./types";
import { isSameUser } from "./utils";

export interface MessageProps extends BubbleProps {
  user: User;
  currentMessage: IMessage;
  nextMessage?: IMessage;
  previousMessage?: IMessage;

  // Settings
  position: "left" | "right";
  containerStyle?: LeftRightStyle<ViewStyle>;
  showUserAvatar?: boolean;
  dateFormat?: string;
  inverted?: boolean;
  renderAvatarOnTop?: boolean;
  showAvatarForEveryMessage?: boolean;
  replyIconColor?: ColorValue;

  // Handlers
  onPressAvatar?: (user: User) => void;
  onLongPressAvatar?: (user: User) => void;
  onMessageLayout?: (event: LayoutChangeEvent) => void;
  onReply?: (message: IMessage) => void;

  // Renders
  renderBubble?: (props: BubbleProps) => React.ReactElement | null;
  renderDay?: (props: DayProps) => React.ReactElement | null;
  renderSystemMessage?: (
    props: SystemMessageProps,
  ) => React.ReactElement | null;
  renderAvatar?: (props: AvatarProps) => React.ReactElement | null;
  renderReplyIcon?: () => React.JSX.Element | null;
}

export const Message: FC<MessageProps> = memo(
  ({
    user,
    currentMessage,
    nextMessage,
    previousMessage,
    position = "left",
    containerStyle,
    showUserAvatar,
    dateFormat,
    inverted = true,
    renderAvatarOnTop,
    showAvatarForEveryMessage,
    replyIconColor,
    onPressAvatar,
    onLongPressAvatar,
    onMessageLayout,
    onReply,
    renderBubble,
    renderDay,
    renderSystemMessage,
    renderAvatar,
    renderReplyIcon,
    ...bubbleProps
  }) => {
    const _renderDay = useCallback(() => {
      if (currentMessage && currentMessage.createdAt) {
        const dayProps: DayProps = {
          dateFormat: dateFormat,
          currentMessage: currentMessage,
          previousMessage: previousMessage,
        };

        if (renderDay) {
          return renderDay(dayProps);
        }

        return <Day {...dayProps} />;
      }

      return null;
    }, [currentMessage, dateFormat, previousMessage, renderDay]);

    const _renderBubble = useCallback(() => {
      const _bubbleProps: BubbleProps = {
        user,
        currentMessage,
        nextMessage,
        previousMessage,
        position,
        ...bubbleProps,
      };

      if (renderBubble) {
        return renderBubble(_bubbleProps);
      }

      return <Bubble {..._bubbleProps} />;
    }, [
      bubbleProps,
      currentMessage,
      nextMessage,
      position,
      previousMessage,
      renderBubble,
      user,
    ]);

    const _renderSystemMessage = useCallback(() => {
      const systemMessageProps: SystemMessageProps = {
        currentMessage,
      };

      if (renderSystemMessage) {
        return renderSystemMessage(systemMessageProps);
      }

      return <SystemMessage {...systemMessageProps} />;
    }, [currentMessage, renderSystemMessage]);

    const _renderAvatar = useCallback(() => {
      if (
        currentMessage &&
        currentMessage.user &&
        user.id === currentMessage.user.id &&
        !showUserAvatar
      ) {
        return null;
      }

      return (
        <Avatar
          currentMessage={currentMessage}
          nextMessage={nextMessage}
          previousMessage={previousMessage}
          position={position}
          renderAvatarOnTop={renderAvatarOnTop}
          showAvatarForEveryMessage={showAvatarForEveryMessage}
          onPressAvatar={onPressAvatar}
          onLongPressAvatar={onLongPressAvatar}
          renderAvatar={renderAvatar}
        />
      );
    }, [
      currentMessage,
      nextMessage,
      onLongPressAvatar,
      onPressAvatar,
      position,
      previousMessage,
      renderAvatar,
      renderAvatarOnTop,
      showAvatarForEveryMessage,
      showUserAvatar,
      user.id,
    ]);

    const isSystem = !!currentMessage.system;

    const messageStyle = useMemo(() => {
      const sameUser = isSameUser(currentMessage, nextMessage);

      return [
        styles[position].container,
        { marginBottom: sameUser || !inverted ? 2 : 10 },
        containerStyle && containerStyle[position],
      ];
    }, [containerStyle, currentMessage, inverted, nextMessage, position]);

    if (currentMessage) {
      return (
        <ReplySwipe
          message={currentMessage}
          replyIconColor={replyIconColor}
          onReply={onReply}
          renderReplyIcon={renderReplyIcon}
          onLayout={onMessageLayout}
        >
          {_renderDay()}
          {isSystem ? (
            _renderSystemMessage()
          ) : (
            <View style={messageStyle}>
              {position === "left" ? (
                _renderAvatar()
              ) : (
                <View style={styles.fakeImage} />
              )}
              {_renderBubble()}
              {position === "right" ? (
                _renderAvatar()
              ) : (
                <View style={styles.fakeImage} />
              )}
            </View>
          )}
        </ReplySwipe>
      );
    }

    return null;
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

const styles = {
  left: StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      marginLeft: 8,
      marginRight: 8,
    },
  }),
  right: StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      marginLeft: 8,
      marginRight: 8,
    },
  }),
  fakeImage: {
    width: 44,
  },
};
