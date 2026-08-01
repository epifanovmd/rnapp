import React, { FC, memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { chatTextBase } from "../model";
import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";
import { useOverlayValue } from "./useOverlayValue";

/**
 * Порт FloatingDateManager: плашка текущей даты вверху при скролле,
 * автоскрытие после floatingDateHideDelay.
 */

interface IFloatingDateOverlayProps {
  store: ChatOverlayStore;
  topInset: number;
}

const selectVisible = (state: IChatOverlayState) => state.floatingDateVisible;
const selectTitle = (state: IChatOverlayState) => state.floatingDateTitle;

export const FloatingDateOverlay: FC<IFloatingDateOverlayProps> = memo(
  ({ store, topInset }) => {
    const { theme, layout, features } = useChatViewContext();
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

    // Порт container.transform: следующий разделитель выталкивает плашку.
    // Сдвиг считается на каждом кадре скролла и приходит shared value —
    // анимировать или проводить через состояние его нельзя, иначе плашка
    // отстанет от подпирающего разделителя.
    const push = store.floatingDatePush;

    const style = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: push.value }],
    }));

    if (!features.showFloatingDate || title == null) {
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
            {title}
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
