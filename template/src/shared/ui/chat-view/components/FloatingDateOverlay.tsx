import React, { FC, memo, useEffect, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { chatTextBase } from "../model";
import { ChatOverlayStore } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";

/**
 * Порт FloatingDateManager: плашка текущей даты вверху при скролле,
 * автоскрытие после floatingDateHideDelay.
 */

interface IFloatingDateOverlayProps {
  store: ChatOverlayStore;
  topInset: number;
}

export const FloatingDateOverlay: FC<IFloatingDateOverlayProps> = memo(
  ({ store, topInset }) => {
    const { theme, layout, features } = useChatViewContext();
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

    const opacity = useSharedValue(0);

    const visible =
      features.showFloatingDate &&
      state.floatingDateVisible &&
      state.floatingDateTitle != null;

    useEffect(() => {
      opacity.value = withTiming(visible ? 1 : 0, {
        duration:
          (visible
            ? layout.floatingDateShowDuration
            : layout.floatingDateHideDuration) * 1000,
      });
    }, [
      visible,
      opacity,
      layout.floatingDateShowDuration,
      layout.floatingDateHideDuration,
    ]);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    if (!features.showFloatingDate || state.floatingDateTitle == null) {
      return null;
    }

    return (
      <Animated.View
        pointerEvents="none"
        style={[ss.wrap, { top: layout.sectionSpacing + topInset }, style]}
      >
        <View
          style={{
            borderRadius: layout.dateSeparatorCornerRadius,
            backgroundColor: theme.dateSeparatorBackground,
            paddingVertical: layout.dateSeparatorVPad,
            paddingHorizontal: layout.dateSeparatorHPad,
          }}
        >
          <Text
            style={[
              chatTextBase,
              {
                fontSize: layout.dateSeparatorFont.fontSize,
                fontWeight: layout.dateSeparatorFont.fontWeight,
                color: theme.dateSeparatorText,
              },
            ]}
          >
            {state.floatingDateTitle}
          </Text>
        </View>
      </Animated.View>
    );
  },
);

FloatingDateOverlay.displayName = "FloatingDateOverlay";

const ss = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
