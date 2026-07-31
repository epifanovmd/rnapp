import React, { FC, memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../chat-view/components/chat-view-context";
import { ChatIcon } from "../chat-view/components/ChatIcon";

/**
 * Порт InputBarLockView: капсула с шевроном и замком над кнопкой микрофона,
 * появляется при записи (spring), увеличивается при движении пальца вверх.
 */

interface IInputLockBadgeProps {
  visible: boolean;
  scale: SharedValue<number>;
}

export const InputLockBadge: FC<IInputLockBadgeProps> = memo(
  ({ visible, scale }) => {
    const { theme, layout } = useChatViewContext();

    const alpha = useSharedValue(0);
    const shift = useSharedValue(20);

    useEffect(() => {
      if (visible) {
        alpha.value = 0;
        shift.value = 20;
        alpha.value = withDelay(100, withTiming(1, { duration: 150 }));
        shift.value = withDelay(
          100,
          withSpring(0, { duration: 300, dampingRatio: 0.7 }),
        );
      } else {
        alpha.value = withTiming(0, { duration: 200 });
      }
    }, [visible, alpha, shift]);

    const style = useAnimatedStyle(() => ({
      opacity: alpha.value,
      transform: [{ translateY: shift.value }, { scale: scale.value }],
    }));

    const size = layout.recordLockContainerSize;

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          ss.wrap,
          {
            width: size,
            height: size + 14,
            borderRadius: size / 2,
            backgroundColor: theme.inputLockBackground,
            bottom: layout.inputButtonSize + layout.recordLockBottomMargin,
          },
          style,
        ]}
      >
        <View style={{ marginTop: layout.recordLockChevronTopPad }}>
          <ChatIcon
            name="chevron.up"
            size={layout.recordLockChevronSize + 2}
            color={theme.inputLockIcon}
            strokeWidth={3.2}
          />
        </View>
        <View
          style={[
            ss.lockIcon,
            { marginTop: layout.recordLockIconCenterOffset - 2 },
          ]}
        >
          <ChatIcon
            name="lock.fill"
            size={layout.recordLockButtonIconSize + 2}
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
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  lockIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
});
