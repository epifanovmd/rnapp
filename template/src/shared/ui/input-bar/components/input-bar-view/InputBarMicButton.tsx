import React, { FC, memo } from "react";
import { Pressable, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useInputBarContext } from "../../config";
import type { useRecordingGesture } from "../../hooks";
import { InputIcon } from "../InputIcon";
import { InputLockBadge } from "../InputLockBadge";

/**
 * Правая кнопка: микрофон с жестом записи, а после фиксации замком — отправка
 * голосового. Над ней всплывает капсула замка.
 */

interface IInputBarMicButtonProps {
  gesture: ReturnType<typeof useRecordingGesture>["recordGesture"];
  isRecording: boolean;
  isLocked: boolean;
  /** Смещение и масштаб от жеста записи. */
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  gestureScale: SharedValue<number>;
  pulseScale: SharedValue<number>;
  /** Кроссфейд «микрофон ↔ отправка». */
  micScale: SharedValue<number>;
  micAlpha: SharedValue<number>;
  lockScale: SharedValue<number>;
  /** Расширение бара вправо, когда микрофон уступает место тексту. */
  containerStyle: ReturnType<typeof useAnimatedStyle>;
  onPress: () => void;
}

export const InputBarMicButton: FC<IInputBarMicButtonProps> = memo(
  ({
    gesture,
    isRecording,
    isLocked,
    translateX,
    translateY,
    gestureScale,
    pulseScale,
    micScale,
    micAlpha,
    lockScale,
    containerStyle,
    onPress,
  }) => {
    const { theme, layout, styles } = useInputBarContext();

    const buttonStyle = useAnimatedStyle(() => ({
      opacity: micAlpha.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: micScale.value * gestureScale.value * pulseScale.value },
      ],
    }));

    const icon = isLocked ? "arrow.up" : "mic.fill";

    return (
      <View>
        <InputLockBadge visible={isRecording && !isLocked} scale={lockScale} />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[buttonStyle, containerStyle]}>
            <Pressable
              style={
                isRecording
                  ? [styles.roundButton, styles.roundButtonActive]
                  : styles.roundButton
              }
              disabled={!isLocked}
              onPress={onPress}
            >
              <InputIcon
                name={icon}
                size={layout.inputIconSize}
                color={isRecording ? "#FFFFFF" : theme.inputTint}
                strokeWidth={icon === "arrow.up" ? 2.6 : 2}
              />
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

InputBarMicButton.displayName = "InputBarMicButton";
