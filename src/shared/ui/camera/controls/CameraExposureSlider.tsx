import { Sun } from "lucide-react-native";
import React, { FC, memo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useCameraApi } from "../core/camera-context";

const THUMB_SIZE = 32;

export interface ICameraExposureSliderProps {
  /** Длина дорожки слайдера */
  trackLength?: number;
  /** Позиция; по умолчанию — у правого края кадра */
  style?: StyleProp<ViewStyle>;
}

/**
 * Вертикальный слайдер экспокоррекции (EV): перетаскивание «солнышка»
 * меняет экспозицию на UI-потоке, двойной тап сбрасывает в 0.
 */
export const CameraExposureSlider: FC<ICameraExposureSliderProps> = memo(
  ({ trackLength = 140, style }) => {
    const { exposure } = useCameraApi();
    const { exposure: value, minExposure, maxExposure, reset } = exposure;

    const usable = trackLength - THUMB_SIZE;

    const pan = Gesture.Pan().onUpdate(event => {
      const y = Math.min(Math.max(event.y - THUMB_SIZE / 2, 0), usable);
      const ratio = 1 - y / usable;

      value.value = minExposure + ratio * (maxExposure - minExposure);
    });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        scheduleOnRN(reset);
      });

    const thumbStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            value.value,
            [minExposure, maxExposure],
            [usable, 0],
          ),
        },
      ],
    }));

    if (minExposure >= maxExposure) {
      return null;
    }

    return (
      <View style={[styles.host, style]} pointerEvents={"box-none"}>
        <GestureDetector gesture={Gesture.Simultaneous(pan, doubleTap)}>
          <View style={[styles.track, { height: trackLength }]}>
            <View style={styles.rail} />
            <Animated.View style={[styles.thumb, thumbStyle]}>
              <Sun color={"#FFD60A"} size={18} />
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  track: {
    width: THUMB_SIZE + 8,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: (THUMB_SIZE + 8) / 2,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingVertical: 0,
  },
  rail: {
    position: "absolute",
    top: THUMB_SIZE / 2,
    bottom: THUMB_SIZE / 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
});
