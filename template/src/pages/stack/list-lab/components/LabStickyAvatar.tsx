import { Avatar } from "@shared/ui";
import React, { FC, memo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface ILabStickyAvatarProps {
  name: string;
  stickyOffset?: SharedValue<number>;
  stickyPinned?: SharedValue<boolean>;
}

/** Mapper аватара существует только у хвоста группы, а не у каждой строки. */
export const LabStickyAvatar: FC<ILabStickyAvatarProps> = memo(
  ({ name, stickyOffset, stickyPinned }) => {
    const style = useAnimatedStyle(() => ({
      opacity: stickyPinned?.value ? 0 : 1,
      transform: [{ translateY: stickyOffset?.value ?? 0 }],
    }));

    return (
      <Animated.View style={style}>
        <Avatar size={36} name={name} />
      </Animated.View>
    );
  },
);

LabStickyAvatar.displayName = "LabStickyAvatar";
