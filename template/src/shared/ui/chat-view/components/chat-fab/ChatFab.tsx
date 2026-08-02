import React, { FC, memo, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ChatOverlayStore, IChatOverlayState } from "../chat-overlay-store";
import { useChatViewContext } from "../chat-view-context";
import { ChatIcon } from "../ChatIcon";
import { LoadingRing } from "../LoadingRing";
import { useOverlayValue } from "../useOverlayValue";
import { FabBadgeLabel } from "./FabBadgeLabel";

/**
 * Кнопка скролла вниз: стрелка, бейдж непрочитанных и кольцо загрузки.
 * Позиция: compact — над кнопкой микрофона, expanded — над панелью ввода
 * (когда в поле есть текст).
 */

const selectFabVisible = (state: IChatOverlayState) => state.fabVisible;
const selectFabExpanded = (state: IChatOverlayState) => state.fabExpanded;
const selectFabLoading = (state: IChatOverlayState) => state.fabLoading;
const selectUnreadCount = (state: IChatOverlayState) => state.unreadCount;

interface IChatFabProps {
  store: ChatOverlayStore;
  /** Нижняя зона экрана (клавиатура / safe area) — от неё считается позиция. */
  bottomInset: SharedValue<number>;
  inputBarHeight: SharedValue<number>;
  onPress: () => void;
}

export const ChatFab: FC<IChatFabProps> = memo(
  ({ store, bottomInset, inputBarHeight, onPress }) => {
    const { theme, layout, features } = useChatViewContext();

    // Поля читаются по одному: видимость пересчитывается на каждом кадре
    // скролла, и подписка на весь снимок тянула бы ре-рендер на любое другое
    // изменение стора.
    const fabVisible = useOverlayValue(store, selectFabVisible);
    const fabExpanded = useOverlayValue(store, selectFabExpanded);
    const fabLoading = useOverlayValue(store, selectFabLoading);
    const unreadCount = useOverlayValue(store, selectUnreadCount);

    const size = layout.inputButtonSize;
    const aboveMicOffset = layout.inputBarVPad + size + layout.fabMargin;
    const singleLineHeight = 2 * layout.inputBarVPad + layout.textViewMinHeight;
    const expandedGap = aboveMicOffset - singleLineHeight;

    const opacity = useSharedValue(0);
    const expandedProgress = useSharedValue(fabExpanded ? 1 : 0);

    const visible = fabVisible || fabLoading;

    useEffect(() => {
      opacity.value = withTiming(visible ? 1 : 0, {
        duration: layout.fabAnimationDuration * 1000,
      });
    }, [visible, opacity, layout.fabAnimationDuration]);

    // Переключение состояния анимируется 0.25 с.
    useEffect(() => {
      expandedProgress.value = withTiming(fabExpanded ? 1 : 0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }, [fabExpanded, expandedProgress]);

    const containerStyle = useAnimatedStyle(() => {
      const compact = aboveMicOffset;
      const expanded = inputBarHeight.value + expandedGap;

      return {
        opacity: opacity.value,
        bottom:
          bottomInset.value +
          compact +
          (expanded - compact) * expandedProgress.value,
      };
    });

    const buttonStyle = useMemo(
      () => [
        ss.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: layout.inputBorderWidth,
          borderColor: theme.fabBorder,
          backgroundColor: theme.fabBackground,
          shadowColor: theme.fabShadowColor,
          shadowOpacity: layout.fabShadowOpacity,
          shadowRadius: layout.fabShadowRadius,
          shadowOffset: { width: 0, height: layout.fabShadowOffsetY },
        },
      ],
      [size, layout, theme],
    );

    const badgeStyle = useMemo(
      () => [
        ss.badge,
        {
          height: layout.fabBadgeHeight,
          minWidth: layout.fabBadgeMinWidth,
          borderRadius: layout.fabBadgeCornerRadius,
          paddingHorizontal: layout.fabBadgePadH,
          backgroundColor: theme.fabBadgeBackground,
          left: 4 - layout.fabBadgeMinWidth / 2,
          top: 4 - layout.fabBadgeHeight / 2,
        },
      ],
      [layout, theme.fabBadgeBackground],
    );

    if (!features.showFab && !fabLoading) return null;

    return (
      <Animated.View
        pointerEvents={visible && !fabLoading ? "auto" : "none"}
        style={[
          ss.container,
          { right: layout.inputBarHPad, width: size },
          containerStyle,
        ]}
      >
        <Pressable style={buttonStyle} onPress={onPress}>
          <View style={fabLoading ? ss.arrowDimmed : undefined}>
            <ChatIcon
              name="chevron.down"
              size={layout.fabArrowSize}
              color={theme.fabArrowColor}
              strokeWidth={2.6}
            />
          </View>
          {fabLoading && (
            <LoadingRing size={size} color={theme.fabArrowColor} />
          )}
        </Pressable>

        {unreadCount > 0 && fabVisible && (
          <View style={badgeStyle}>
            <FabBadgeLabel count={unreadCount} />
          </View>
        )}
      </Animated.View>
    );
  },
);

ChatFab.displayName = "ChatFab";

const ss = StyleSheet.create({
  container: { position: "absolute" },
  button: { alignItems: "center", justifyContent: "center", elevation: 4 },
  badge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDimmed: { opacity: 0.3 },
});
