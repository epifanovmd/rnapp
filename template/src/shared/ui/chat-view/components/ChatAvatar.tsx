import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";

import { chatTextBase } from "../utils";
import { ChatText } from "./ChatText";

/**
 * Круглая аватарка с фоллбэком на инициал
 * (детерминированный цвет из hash имени).
 */

const nameHash = (name: string): number => {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 2147483647;
  }

  return Math.abs(hash);
};

interface IChatAvatarProps {
  name: string;
  url?: string;
  size: number;
}

export const ChatAvatar: FC<IChatAvatarProps> = memo(({ name, url, size }) => {
  const hue = (nameHash(name) % 360) / 360;

  return (
    <View
      style={[
        ss.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${Math.round(hue * 360)}, 45%, 62%)`,
        },
      ]}
    >
      <ChatText style={[chatTextBase, ss.initial, { fontSize: size * 0.42 }]}>
        {name.slice(0, 1).toUpperCase()}
      </ChatText>
      {!!url && (
        <FastImage
          style={StyleSheet.absoluteFill}
          source={{ uri: url }}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
    </View>
  );
});

ChatAvatar.displayName = "ChatAvatar";

const ss = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
