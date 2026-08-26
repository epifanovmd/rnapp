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

/** Диаметр кнопки — тот же, что у кнопок панели ввода. */
const FAB_SIZE = 40;
const BADGE_SIZE = 20;

/** Отступ над микрофоном свёрнутой панели и добавка на выросшую панель. */
const ABOVE_MIC_OFFSET = 60;
const EXPANDED_GAP = 4;

const FADE_MS = 250;

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
    const { colors } = useChatViewContext();

    const containerStyle = useAnimatedStyle(() => {
      const visible =
        (isLoading || (!isNearEnd.value && hasMessages)) &&
        hiddenForRecording.value === 0;
      const expandedBottom = inputBarHeight.value + EXPANDED_GAP;

      return {
        opacity: withTiming(visible ? 1 : 0, { duration: FADE_MS }),
        bottom:
          bottomInset.value +
          ABOVE_MIC_OFFSET +
          (expandedBottom - ABOVE_MIC_OFFSET) * expanded.value,
        // Видимость считается на UI-потоке, поэтому pointerEvents задаётся
        // стилем, а не пропом — React не должен перехватывать тапы скрытой кнопки.
        pointerEvents: visible && !isLoading ? "auto" : "none",
      };
    });

    // Цвета меняются только со сменой темы.
    const buttonStyle = useMemo(
      () => [
        ss.button,
        {
          borderColor: colors.fabBorder,
          backgroundColor: colors.fabBackground,
          shadowColor: colors.fabShadowColor,
        },
      ],
      [colors],
    );

    const badgeStyle = useMemo(
      () => [ss.badge, { backgroundColor: colors.fabBadgeBackground }],
      [colors.fabBadgeBackground],
    );

    return (
      <Animated.View style={[ss.container, containerStyle]}>
        <Pressable style={buttonStyle} onPress={onPress}>
          <View style={isLoading ? ss.arrowDimmed : undefined}>
            <ChatIcon
              name="chevron.down"
              size={18}
              color={colors.fabArrowColor}
              strokeWidth={2.6}
            />
          </View>
          {isLoading && (
            <LoadingRing size={FAB_SIZE} color={colors.fabArrowColor} />
          )}
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
  container: { position: "absolute", right: 12, width: FAB_SIZE },
  button: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 0.5,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    height: BADGE_SIZE,
    minWidth: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    paddingHorizontal: 6,
    left: 4 - BADGE_SIZE / 2,
    top: 4 - BADGE_SIZE / 2,
  },
  arrowDimmed: { opacity: 0.3 },
});
