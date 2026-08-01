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
            // Капсула, а не круг: в поде высота на 14 больше ширины, шеврон
            // прижат к верху, замок центрирован со смещением вниз.
            width: layout.recordLockContainerSize,
            height: layout.recordLockContainerSize + LOCK_EXTRA_HEIGHT,
            borderRadius: layout.recordLockContainerSize / 2,
            backgroundColor: theme.inputLockBackground,
          },
          badgeStyle,
        ]}
      >
        <View style={[ss.chevron, { top: layout.recordLockChevronTopPad }]}>
          <InputIcon
            name="chevron.up"
            size={layout.recordLockChevronSize}
            color={theme.inputLockIcon}
          />
        </View>
        <View
          style={{
            transform: [{ translateY: layout.recordLockIconCenterOffset }],
          }}
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

/** Насколько капсула выше своей ширины (порт `recordLockContainerSize + 14`). */
const LOCK_EXTRA_HEIGHT = 14;

const ss = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    alignSelf: "center",
  },
  chevron: { position: "absolute" },
});
