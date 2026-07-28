import { BlurView } from "@react-native-community/blur";
import { BlurViewProps } from "@react-native-community/blur/src";
import React, { memo, useState } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useHoldItemContext } from "../hooks";
import { CONTEXT_MENU_STATE } from "../utils";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const Backdrop = memo<BlurViewProps>(props => {
  const { state, duration } = useHoldItemContext();
  const animatedOpacity = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  useAnimatedReaction(
    () => state.value,
    () => {
      const isActive = state.value === CONTEXT_MENU_STATE.ACTIVE;

      scheduleOnRN(setVisible, isActive);
      animatedOpacity.value = withTiming(isActive ? 1 : 0, {
        duration,
      });
    },
  );

  const tapGesture = Gesture.Tap().onStart(() => {
    if (state.value === CONTEXT_MENU_STATE.ACTIVE) {
      state.value = CONTEXT_MENU_STATE.END;
    }
  });

  const style = useAnimatedStyle(() => {
    return {
      opacity: animatedOpacity.value,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <GestureDetector gesture={tapGesture}>
      <AnimatedBlurView
        {...props}
        style={[styles.container, style, props.style]}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </AnimatedBlurView>
    </GestureDetector>
  );
});

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
