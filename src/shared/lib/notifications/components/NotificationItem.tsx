import React, { FC, memo, useCallback, useEffect } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  INotificationStore,
  NotificationInstance,
} from "../notification.types";
import { NotificationContent } from "./NotificationContent";

export interface NotificationItemProps {
  notification: NotificationInstance;
  /** Глобальный кастомный рендер контента (per-notification `render` приоритетнее). */
  renderContent?: (notification: NotificationInstance) => React.ReactNode;
}

const ENTER_OFFSET = 24;
const SWIPE_DISMISS_DISTANCE = 32;
const SWIPE_DISMISS_VELOCITY = 300;
const ANIMATION_DURATION = 200;

/**
 * Поведенческая оболочка одного уведомления: анимации появления/скрытия,
 * swipe-to-dismiss, пауза таймера на время жеста, tap-обработка.
 * Визуал делегируется NotificationContent / кастомному рендеру.
 */
export const NotificationItem: FC<NotificationItemProps> = memo(
  ({ notification, renderContent }) => {
    const store = INotificationStore.useInstance();
    const { id, position, closing, swipeToDismiss } = notification;

    /** Направление к краю экрана: top → вверх (-1), bottom → вниз (+1). */
    const direction = position === "top" ? -1 : 1;

    const progress = useSharedValue(0);
    const dragY = useSharedValue(0);
    const height = useSharedValue(0);
    const swipedOff = useSharedValue(false);

    const finalize = useCallback(() => store.finalize(id), [store, id]);
    const pauseTimer = useCallback(() => store.pauseTimer(id), [store, id]);
    const resumeTimer = useCallback(() => store.resumeTimer(id), [store, id]);
    const dismissBySwipe = useCallback(
      () => store.dismiss(id, "swipe"),
      [store, id],
    );

    useEffect(() => {
      progress.value = withTiming(1, { duration: ANIMATION_DURATION });
    }, [progress]);

    useEffect(() => {
      if (!closing) {
        return;
      }

      if (swipedOff.value) {
        finalize();

        return;
      }

      progress.value = withTiming(
        0,
        { duration: ANIMATION_DURATION },
        finished => {
          if (finished) {
            scheduleOnRN(finalize);
          }
        },
      );
    }, [closing, swipedOff, progress, finalize]);

    const handlePress = useCallback(() => {
      notification.onPress?.();

      if (notification.dismissOnPress) {
        store.dismiss(id, "press");
      }
    }, [notification, store, id]);

    const handleActionPress = useCallback(() => {
      const { action } = notification;

      if (!action) {
        return;
      }

      action.onPress();

      if (action.dismissOnPress !== false) {
        store.dismiss(id, "action");
      }
    }, [notification, store, id]);

    const panGesture = Gesture.Pan()
      .enabled(swipeToDismiss && !closing)
      .onBegin(() => {
        scheduleOnRN(pauseTimer);
      })
      .onUpdate(event => {
        const toward = event.translationY * direction > 0;

        dragY.value = toward ? event.translationY : event.translationY * 0.15;
      })
      .onEnd(event => {
        const distance = event.translationY * direction;
        const velocity = event.velocityY * direction;

        if (
          distance > SWIPE_DISMISS_DISTANCE ||
          velocity > SWIPE_DISMISS_VELOCITY
        ) {
          swipedOff.value = true;
          dragY.value = withTiming(
            direction * (height.value + ENTER_OFFSET * 4),
            { duration: ANIMATION_DURATION },
            () => {
              scheduleOnRN(dismissBySwipe);
            },
          );
        }
      })
      .onFinalize(() => {
        if (!swipedOff.value) {
          dragY.value = withTiming(0);
          scheduleOnRN(resumeTimer);
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [
        {
          translateY:
            (1 - progress.value) * direction * ENTER_OFFSET + dragY.value,
        },
      ],
    }));

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        height.value = event.nativeEvent.layout.height;
      },
      [height],
    );

    const content = notification.render?.(notification) ??
      renderContent?.(notification) ?? (
        <NotificationContent
          notification={notification}
          onActionPress={handleActionPress}
        />
      );

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.item, animatedStyle]}
          layout={LinearTransition.duration(ANIMATION_DURATION)}
          onLayout={handleLayout}
        >
          <Pressable
            disabled={!notification.onPress && !notification.dismissOnPress}
            onPress={handlePress}
            accessibilityRole="alert"
          >
            {content}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  item: {
    width: "100%",
  },
});
