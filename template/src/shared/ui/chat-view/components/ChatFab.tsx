import React, { FC, memo, useEffect, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { chatTextBase } from "../model";
import { ChatOverlayStore } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";
import { ChatIcon } from "./ChatIcon";

/**
 * Порт FABManager + fabView/fabBadgeView: круглая кнопка скролла вниз
 * со стрелкой, бейджем непрочитанных и спиннер-кольцом загрузки.
 * Позиция: compact — над кнопкой микрофона; expanded — над панелью ввода
 * (когда в поле есть текст).
 */

interface IChatFabProps {
  store: ChatOverlayStore;
  /** Нижний отступ контента (клавиатура / safe area) — панель стоит на нём. */
  bottomInset: SharedValue<number>;
  /** Текущая высота панели ввода. */
  inputBarHeight: SharedValue<number>;
  onPress: () => void;
}

export const ChatFab: FC<IChatFabProps> = memo(
  ({ store, bottomInset, inputBarHeight, onPress }) => {
    const { theme, layout, features } = useChatViewContext();
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

    const size = layout.inputButtonSize;
    const aboveMicOffset = layout.inputBarVPad + size + layout.fabMargin;
    const singleLineHeight = 2 * layout.inputBarVPad + layout.textViewMinHeight;
    const expandedGap = aboveMicOffset - singleLineHeight;

    const opacity = useSharedValue(0);
    const spin = useSharedValue(0);
    // Порт setExpanded: переключение между compact- и expanded-констрейнтом
    // анимируется 0.25s, а сами привязки считаются от живой геометрии панели.
    const expandedProgress = useSharedValue(state.fabExpanded ? 1 : 0);

    const visible = state.fabVisible || state.fabLoading;

    useEffect(() => {
      opacity.value = withTiming(visible ? 1 : 0, {
        duration: layout.fabAnimationDuration * 1000,
      });
    }, [visible, opacity, layout.fabAnimationDuration]);

    useEffect(() => {
      expandedProgress.value = withTiming(state.fabExpanded ? 1 : 0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }, [state.fabExpanded, expandedProgress]);

    useEffect(() => {
      if (state.fabLoading) {
        spin.value = 0;
        spin.value = withRepeat(
          withTiming(360, { duration: 800, easing: Easing.linear }),
          -1,
        );
      } else {
        cancelAnimation(spin);
        spin.value = 0;
      }
    }, [state.fabLoading, spin]);

    const containerStyle = useAnimatedStyle(() => {
      // compact: от нижнего края панели; expanded: от её верхнего края.
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

    const ringStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${spin.value}deg` }],
    }));

    const arrowStyle = { opacity: state.fabLoading ? 0.3 : 1 };

    if (!features.showFab && !state.fabLoading) return null;

    const showBadge = state.unreadCount > 0 && state.fabVisible;

    return (
      <Animated.View
        pointerEvents={visible && !state.fabLoading ? "auto" : "none"}
        style={[
          ss.container,
          { right: layout.inputBarHPad, width: size },
          containerStyle,
        ]}
      >
        <Pressable
          style={[
            ss.fabButton,
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
          ]}
          onPress={onPress}
        >
          <View style={arrowStyle}>
            <ChatIcon
              name="chevron.down"
              size={layout.fabArrowSize}
              color={theme.fabArrowColor}
              strokeWidth={2.6}
            />
          </View>

          {state.fabLoading && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, ringStyle]}
            >
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Path
                  d={loadingArcPath(size, 4)}
                  stroke={theme.fabArrowColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          )}
        </Pressable>

        {showBadge && (
          <View
            style={[
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
            ]}
          >
            <Text
              style={[
                chatTextBase,
                {
                  fontSize: layout.fabBadgeFont.fontSize,
                  fontWeight: layout.fabBadgeFont.fontWeight,
                  fontVariant: ["tabular-nums"],
                  color: theme.fabBadgeTextColor,
                },
              ]}
            >
              {state.unreadCount > 99 ? "99+" : `${state.unreadCount}`}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  },
);

ChatFab.displayName = "ChatFab";

/** Дуга 270° по внутреннему контуру (порт loadingRing: strokeEnd 0.75). */
const loadingArcPath = (size: number, inset: number): string => {
  const c = size / 2;
  const r = c - inset;

  return `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - r} ${c}`;
};

const ss = StyleSheet.create({
  container: {
    position: "absolute",
  },
  fabButton: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  badge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
