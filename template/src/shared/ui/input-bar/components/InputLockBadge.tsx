import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

import { useLockBadgeAnimation } from "../hooks/useLockBadgeAnimation";
import { useInputBarContext } from "../model/input-bar-context";
import { InputIcon } from "./InputIcon";

/**
 * Порт InputBarLockView: капсула с шевроном и замком над кнопкой микрофона,
 * появляется при свайпе вверх во время записи.
 */

interface IInputLockBadgeProps {
  visible: boolean;
  scale: SharedValue<number>;
}

export const InputLockBadge: FC<IInputLockBadgeProps> = memo(
  ({ visible, scale }) => {
    const { theme, layout } = useInputBarContext();

    const { badgeStyle } = useLockBadgeAnimation(visible, scale);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          ss.wrap,
          {
            bottom: layout.inputButtonSize + layout.recordLockBottomMargin,
            width: layout.recordLockContainerSize,
            height: layout.recordLockContainerSize,
            borderRadius: layout.recordLockContainerSize / 2,
            backgroundColor: theme.inputLockBackground,
          },
          badgeStyle,
        ]}
      >
        <View
          style={{
            marginTop:
              layout.recordLockChevronTopPad +
              layout.recordLockIconCenterOffset,
          }}
        >
          <InputIcon
            name="chevron.up"
            size={layout.recordLockChevronSize}
            color={theme.inputLockIcon}
          />
        </View>
        <View
          style={[
            ss.lockIcon,
            { marginTop: layout.recordLockIconCenterOffset },
          ]}
        >
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

const ss = StyleSheet.create({
  wrap: {
    alignItems: "center",
    position: "absolute",
    alignSelf: "center",
  },
  lockIcon: {},
});
