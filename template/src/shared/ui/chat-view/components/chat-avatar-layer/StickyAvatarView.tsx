import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ChatAvatar } from "../ChatAvatar";

/** Один sticky-аватар: позицию ведёт shared value, ре-рендеров при скролле нет. */

interface IStickyAvatarViewProps {
  y: SharedValue<number>;
  name: string;
  url?: string;
  size: number;
  left: number;
}

export const StickyAvatarView: FC<IStickyAvatarViewProps> = memo(
  ({ y, name, url, size, left }) => {
    const style = useAnimatedStyle(() => ({
      transform: [{ translateY: y.value }],
    }));

    return (
      <Animated.View style={[ss.avatar, { left, width: size }, style]}>
        <ChatAvatar name={name} url={url} size={size} />
      </Animated.View>
    );
  },
);

StickyAvatarView.displayName = "StickyAvatarView";

const ss = StyleSheet.create({
  avatar: { position: "absolute", top: 0 },
});
