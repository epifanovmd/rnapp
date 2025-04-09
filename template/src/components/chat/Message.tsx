import React, { FC, memo } from "react";
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
    renderBubble,
    renderDay,
    renderSystemMessage,
    renderAvatar,
    renderReplyIcon,
    ...bubbleProps
  }) => {
    const isSystem = !!currentMessage?.system;
    const sameUser = isSameUser(currentMessage, nextMessage);

    const messageStyle = [
      stylesByPosition[position].container,
      { marginBottom: sameUser || !inverted ? 2 : 10 },
      containerStyle?.[position],
    ];

    const _renderDay = () => {
      if (!currentMessage?.createdAt) return null;

      return renderDay ? (
        renderDay({ dateFormat, currentMessage, previousMessage })
      ) : (
        <Day
          dateFormat={dateFormat}
          currentMessage={currentMessage}
          previousMessage={previousMessage}
        />
      );
    };

    const _renderBubble = () => {
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
    };

    const _renderSystemMessage = () => {
      return renderSystemMessage ? (
        renderSystemMessage({ currentMessage })
      ) : (
        <SystemMessage currentMessage={currentMessage} />
      );
    };

    const _renderAvatar = () => {
      if (!showUserAvatar && user.id === currentMessage?.user?.id) return null;

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
    };

    if (!currentMessage) return null;

    return (
      <>
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
      </>
    );
  },
);

const styles = StyleSheet.create({
  leftContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginLeft: 8,
    marginRight: 8,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginLeft: 8,
    marginRight: 8,
  },
  fakeImage: {
    width: 44,
  },
});

const stylesByPosition = {
  left: { container: styles.leftContainer },
  right: { container: styles.rightContainer },
};
