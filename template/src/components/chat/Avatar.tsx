import React, { memo } from "react";
import {
  ImageStyle,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { ChatAvatar } from "./ChatAvatar";
import { IMessage, LeftRightStyle, Omit, User } from "./types";
import { isSameDay, isSameUser } from "./utils";

export interface AvatarProps {
  currentMessage?: IMessage;
  previousMessage?: IMessage;
  nextMessage?: IMessage;
  position: "left" | "right";
  renderAvatarOnTop?: boolean;
  showAvatarForEveryMessage?: boolean;
  imageStyle?: LeftRightStyle<ImageStyle>;
  containerStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: TextStyle;

  renderAvatar?: (
    props: Omit<AvatarProps, "renderAvatar">,
  ) => React.ReactElement | null;
  onPressAvatar?: (user: User) => void;
  onLongPressAvatar?: (user: User) => void;
}

export const Avatar = memo((props: AvatarProps) => {
  const {
    currentMessage,
    previousMessage,
    nextMessage,
    position = "left",
    renderAvatarOnTop = false,
    showAvatarForEveryMessage = false,
    imageStyle,
    containerStyle,
    textStyle,
    renderAvatar,
    onPressAvatar,
    onLongPressAvatar,
  } = props;
  const messageToCompare = renderAvatarOnTop ? previousMessage : nextMessage;
  const computedStyle = renderAvatarOnTop ? "onTop" : "onBottom";

  if (
    !showAvatarForEveryMessage &&
    currentMessage &&
    messageToCompare &&
    isSameUser(currentMessage, messageToCompare) &&
    isSameDay(currentMessage, messageToCompare)
  ) {
    return (
      <View
        style={[
          styles[position].container,
          styles[position][computedStyle],
          containerStyle && containerStyle[position],
        ]}
      >
        <ChatAvatar
          avatarStyle={[
            styles[position].image,
            imageStyle && imageStyle[position],
          ]}
        />
      </View>
    );
  }

  const renderAvatarComponent = () => {
    if (renderAvatar) {
      return renderAvatar({
        renderAvatarOnTop,
        showAvatarForEveryMessage,
        containerStyle,
        position,
        currentMessage,
        previousMessage,
        nextMessage,
        imageStyle,
        onPressAvatar,
        textStyle,
        onLongPressAvatar,
      });
    }

    if (props.currentMessage) {
      return (
        <ChatAvatar
          avatarStyle={[
            styles[props.position].image,
            props.imageStyle && props.imageStyle[props.position],
          ]}
          user={props.currentMessage.user}
          onPress={props.onPressAvatar}
          onLongPress={props.onLongPressAvatar}
        />
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles[position].container,
        styles[position][computedStyle],
        containerStyle && containerStyle[position],
      ]}
    >
      {renderAvatarComponent()}
    </View>
  );
});

const styles = {
  left: StyleSheet.create({
    container: {
      flexDirection: "row",
      marginRight: 8,
    },
    onTop: {
      alignSelf: "flex-start",
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
  right: StyleSheet.create({
    container: {
      flexDirection: "row",
      marginLeft: 8,
    },
    onTop: {
      alignSelf: "flex-start",
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
};
