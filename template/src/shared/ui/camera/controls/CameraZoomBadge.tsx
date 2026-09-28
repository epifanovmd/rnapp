import React, { FC, memo } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useCameraApi } from "../core/camera-context";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface ICameraZoomBadgeProps {
  /** Позиция бейджа; по умолчанию — сверху по центру кадра */
  style?: StyleProp<ViewStyle>;
}

/**
 * Плавающий индикатор кратности «2.4×»: виден во время жеста зума,
 * значение обновляется на UI-потоке без ре-рендеров.
 */
export const CameraZoomBadge: FC<ICameraZoomBadgeProps> = memo(({ style }) => {
  const { zoom } = useCameraApi();
  const { zoom: zoomValue, isInteracting } = zoom;

  const opacity = useDerivedValue(() =>
    isInteracting.value
      ? withTiming(1, { duration: 120 })
      : withDelay(600, withTiming(0, { duration: 250 })),
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // `text` — нативный проп TextInput, обновляется без ре-рендера
  const textProps = useAnimatedProps(
    () =>
      ({
        text: `${zoomValue.value.toFixed(1)}×`,
      }) as unknown as Partial<TextInputProps>,
  );

  return (
    <View style={[styles.host, style]} pointerEvents={"none"}>
      <Animated.View style={[styles.badge, containerStyle]}>
        <AnimatedTextInput
          animatedProps={textProps}
          defaultValue={"1.0×"}
          style={styles.text}
          editable={false}
          allowFontScaling={false}
          underlineColorAndroid={"transparent"}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  badge: {
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 12,
  },
  text: {
    // Ширина фиксированная: нативное обновление `text` не перезапускает
    // layout, и строка шире замера по defaultValue обрезалась бы
    width: 52,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    paddingVertical: 6,
    padding: 0,
    textAlign: "center",
  },
});
