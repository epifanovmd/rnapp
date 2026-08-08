import React, { FC, memo, PropsWithChildren } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { Touchable } from "../../touchable";

export interface ICameraControlButtonProps {
  onPress: () => void;
  size?: number;
  /** Подсветка активного состояния (например, включённый фонарик) */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Круглая полупрозрачная кнопка контролов поверх кадра */
export const CameraControlButton: FC<
  PropsWithChildren<ICameraControlButtonProps>
> = memo(
  ({
    onPress,
    size = 44,
    active = false,
    style,
    accessibilityLabel,
    children,
  }) => (
    <Touchable
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        active && styles.active,
        style,
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Touchable>
  ),
);

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  active: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});
