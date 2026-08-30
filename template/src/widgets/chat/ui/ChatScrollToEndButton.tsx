import { Fab } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

/** Зазор между кнопкой и верхней кромкой панели ввода. */
const GAP = 12;
const FADE_DURATION = 250;

export interface IChatScrollToEndButtonProps {
  /**
   * Живое перекрытие снизу: кнопка держится над панелью ввода и едет с
   * клавиатурой в один кадр с ней.
   */
  bottomInset: SharedValue<number>;
  /** Список у конца — кнопка не нужна. */
  isAtEnd: SharedValue<boolean>;
  onPress: () => void;
}

/**
 * Кнопка возврата к последнему сообщению.
 *
 * Позиция и видимость считаются на UI-потоке: `isAtEnd` приходит из
 * `sharedValues` списка, отступ — из той же величины, что получает контент.
 * Двигается трансформом, а не `bottom`: тот пересчитывал бы раскладку каждый
 * кадр анимации.
 */
export const ChatScrollToEndButton: FC<IChatScrollToEndButtonProps> = memo(
  ({ bottomInset, isAtEnd, onPress }) => {
    const style = useAnimatedStyle(() => ({
      opacity: withTiming(isAtEnd.value ? 0 : 1, { duration: FADE_DURATION }),
      transform: [{ translateY: -(bottomInset.value + GAP) }],
      // Видимость живёт на UI-потоке, поэтому pointerEvents задаётся стилем:
      // React не должен перехватывать тапы скрытой кнопки.
      pointerEvents: isAtEnd.value ? "none" : "auto",
    }));

    return (
      <Animated.View style={[ss.container, style]}>
        <Fab icon={"chevronDown"} onPress={onPress} />
      </Animated.View>
    );
  },
);

ChatScrollToEndButton.displayName = "ChatScrollToEndButton";

const ss = StyleSheet.create({
  container: { bottom: 0, position: "absolute", right: 12 },
});
