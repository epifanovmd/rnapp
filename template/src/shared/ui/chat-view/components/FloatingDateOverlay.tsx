import React, { FC, memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";
import { useOverlayValue } from "./useOverlayValue";

/**
 * Плашка текущей даты при скролле, с автоскрытием через
 * `floatingDateHideDelay`.
 */

const selectVisible = (state: IChatOverlayState) => state.floatingDateVisible;
const selectTitle = (state: IChatOverlayState) => state.floatingDateTitle;

interface IFloatingDateOverlayProps {
  store: ChatOverlayStore;
  topInset: number;
}

export const FloatingDateOverlay: FC<IFloatingDateOverlayProps> = memo(
  ({ store, topInset }) => {
    const { layout, features, styles } = useChatViewContext();

    const isShown = useOverlayValue(store, selectVisible);
    const title = useOverlayValue(store, selectTitle);

    const opacity = useSharedValue(0);
    const visible = features.showFloatingDate && isShown && title != null;

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

    // Сдвиг плашки подпирающим разделителем считается на каждом кадре скролла,
    // поэтому едет shared value: анимировать или вести состоянием нельзя.
    const push = store.floatingDatePush;

    const style = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: push.value }],
    }));

    if (!features.showFloatingDate || title == null) return null;

    return (
      <Animated.View
        pointerEvents="none"
        style={[ss.wrap, { top: layout.sectionSpacing + topInset }, style]}
      >
        <View style={styles.shared.dateSeparatorPill}>
          <Text style={styles.shared.dateSeparatorText}>{title}</Text>
        </View>
      </Animated.View>
    );
  },
);

FloatingDateOverlay.displayName = "FloatingDateOverlay";

const ss = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
