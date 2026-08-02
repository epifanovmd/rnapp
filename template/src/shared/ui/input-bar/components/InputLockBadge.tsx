import React, { FC, memo } from "react";
import { View } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

import { useInputBarContext } from "../config";
import { useLockBadgeAnimation } from "../hooks";
import { InputIcon } from "./InputIcon";

/**
 * Капсула замка над микрофоном — порт `InputBarLockView`: появляется при
 * свайпе вверх во время записи.
 */

interface IInputLockBadgeProps {
  visible: boolean;
  scale: SharedValue<number>;
}

export const InputLockBadge: FC<IInputLockBadgeProps> = memo(
  ({ visible, scale }) => {
    const { theme, layout, styles } = useInputBarContext();

    const { badgeStyle } = useLockBadgeAnimation(visible, scale);

    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.lockBadge, badgeStyle]}
      >
        <View style={styles.lockChevron}>
          <InputIcon
            name="chevron.up"
            size={layout.recordLockChevronSize}
            color={theme.inputLockIcon}
          />
        </View>
        <View style={styles.lockIconShift}>
          <InputIcon
            name="lock.fill"
            size={layout.recordLockButtonIconSize}
            color={theme.inputLockIcon}
          />
        </View>
      </Animated.View>
    );
  },
);

InputLockBadge.displayName = "InputLockBadge";
