import React, { FC, memo } from "react";
import { View } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

import { useInputBarSkin, useLockBadgeAnimation } from "../hooks";
import { InputIcon } from "./InputIcon";

/**
 * Капсула замка над микрофоном: появляется при
 * свайпе вверх во время записи.
 */

interface IInputLockBadgeProps {
  visible: boolean;
  scale: SharedValue<number>;
}

export const InputLockBadge: FC<IInputLockBadgeProps> = memo(
  ({ visible, scale }) => {
    const { colors, styles } = useInputBarSkin();

    const { badgeStyle } = useLockBadgeAnimation(visible, scale);

    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.lockBadge, badgeStyle]}
      >
        <View style={styles.lockChevron}>
          <InputIcon name="chevron.up" size={10} color={colors.inputLockIcon} />
        </View>
        <View style={styles.lockIconShift}>
          <InputIcon name="lock.fill" size={14} color={colors.inputLockIcon} />
        </View>
      </Animated.View>
    );
  },
);

InputLockBadge.displayName = "InputLockBadge";
