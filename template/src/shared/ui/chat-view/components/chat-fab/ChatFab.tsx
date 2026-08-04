import React, { FC, memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../../model";
import { ChatIcon } from "../ChatIcon";
import { LoadingRing } from "../LoadingRing";
import { FabBadgeLabel } from "./FabBadgeLabel";

/**
 * Кнопка скролла вниз: стрелка, бейдж непрочитанных и кольцо загрузки.
 *
 * Видимость и позиция считаются на UI-потоке; через React проходит только
 * счётчик непрочитанных и флаг загрузки.
 */
export interface IChatFabProps {
  /** Нижняя зона экрана (клавиатура / safe area). */
  bottomInset: SharedValue<number>;
  inputBarHeight: SharedValue<number>;
  /** Список у нижнего края — тогда кнопка не нужна. */
  isNearEnd: SharedValue<boolean>;
  /** 0..1 — расхождение вверх под выросшую панель ввода. */
  expanded: SharedValue<number>;
  /** 1 — спрятать на время записи голоса. */
  hiddenForRecording: SharedValue<number>;
  /** Принудительный показ со спиннером (возврат к последним сообщениям). */
  isLoading: boolean;
  /** В пустом чате прокручивать некуда — кнопки быть не должно. */
  hasMessages: boolean;
  unreadCount: number;
  onPress: () => void;
}

export const ChatFab: FC<IChatFabProps> = memo(
  ({
    bottomInset,
    inputBarHeight,
    isNearEnd,
    expanded,
    hiddenForRecording,
    isLoading,
    hasMessages,
    unreadCount,
    onPress,
  }) => {
    const { theme, layout, inputBarLayout, features } = useChatViewContext();

    const size = inputBarLayout.inputButtonSize;
    const aboveMicOffset =
      inputBarLayout.inputBarVPad + size + layout.fabMargin;
    const singleLineHeight =
      2 * inputBarLayout.inputBarVPad + inputBarLayout.textViewMinHeight;
    const expandedGap = aboveMicOffset - singleLineHeight;
    const fadeMs = layout.fabAnimationDuration * 1000;

    const containerStyle = useAnimatedStyle(() => {
      const visible =
        (isLoading || (!isNearEnd.value && hasMessages)) &&
        hiddenForRecording.value === 0;
      const expandedBottom = inputBarHeight.value + expandedGap;

      return {
        opacity: withTiming(visible ? 1 : 0, { duration: fadeMs }),
        bottom:
          bottomInset.value +
          aboveMicOffset +
          (expandedBottom - aboveMicOffset) * expanded.value,
        // Видимость считается на UI-потоке, поэтому pointerEvents задаётся
        // стилем, а не пропом — React не должен перехватывать тапы скрытой кнопки.
        pointerEvents: visible && !isLoading ? "auto" : "none",
      };
    });

    // Метрики кнопки и бейджа меняются только со сменой темы или лейаута.
    const buttonStyle = useMemo(
      () => [
        ss.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: inputBarLayout.inputBorderWidth,
          borderColor: theme.fabBorder,
          backgroundColor: theme.fabBackground,
          shadowColor: theme.fabShadowColor,
          shadowOpacity: layout.fabShadowOpacity,
          shadowRadius: layout.fabShadowRadius,
          shadowOffset: { width: 0, height: layout.fabShadowOffsetY },
        },
      ],
      [size, inputBarLayout.inputBorderWidth, layout, theme],
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

    if (!features.showFab && !isLoading) return null;

    return (
      <Animated.View
        style={[
          ss.container,
          { right: inputBarLayout.inputBarHPad, width: size },
          containerStyle,
        ]}
      >
        <Pressable style={buttonStyle} onPress={onPress}>
          <View style={isLoading ? ss.arrowDimmed : undefined}>
            <ChatIcon
              name="chevron.down"
              size={layout.fabArrowSize}
              color={theme.fabArrowColor}
              strokeWidth={2.6}
            />
          </View>
          {isLoading && <LoadingRing size={size} color={theme.fabArrowColor} />}
        </Pressable>

        {unreadCount > 0 && (
          <View style={badgeStyle} pointerEvents="none">
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
