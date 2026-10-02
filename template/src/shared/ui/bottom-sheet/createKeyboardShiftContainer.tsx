import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

/**
 * `containerComponent` модалки gorhom со сдвигом шторки над клавиатурой.
 * Transform стоит снаружи gorhom: его расчёты позиции, жестов и
 * dynamic sizing идут в координатах контейнера и сдвига не видят.
 * Компонент создаётся один раз на шторку — идентичность стабильна.
 */
export const createKeyboardShiftContainer = (shift: SharedValue<number>) => {
  const KeyboardShiftContainer: FC<PropsWithChildren> = ({ children }) => {
    const style = useAnimatedStyle(() => ({
      transform: [{ translateY: shift.value }],
    }));

    return (
      <Animated.View
        pointerEvents={"box-none"}
        style={[StyleSheet.absoluteFill, style]}
      >
        {children}
      </Animated.View>
    );
  };

  KeyboardShiftContainer.displayName = "KeyboardShiftContainer";

  return KeyboardShiftContainer;
};
