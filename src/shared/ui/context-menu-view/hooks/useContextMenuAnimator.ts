import { useCallback, useMemo } from "react";
import { ViewStyle } from "react-native";
import {
  AnimatedStyle,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CONTEXT_MENU_PANEL_GAP } from "../config";
import { CONTEXT_MENU_PANEL_SCALE, IContextMenuLayout } from "../layout";
import { IContextMenuRect } from "../types";

const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

const CLOSE_DAMPING = 0.9;
const CLOSE_VELOCITY = 0.2;

/** Пружина открытия и длительность закрытия (мс). */
const OPEN_DURATION_MS = 400;
const OPEN_DAMPING = 0.82;
const OPEN_VELOCITY = 0.5;
const CLOSE_DURATION_MS = 260;

interface ISpringSpec {
  durationMs: number;
  dampingRatio: number;

  normalizedVelocity: number;
}

const springTo = (
  sv: SharedValue<number>,
  to: number,
  { durationMs, dampingRatio, normalizedVelocity }: ISpringSpec,
  onFinished?: () => void,
) => {
  sv.value = withSpring(
    to,
    {
      duration: durationMs,
      dampingRatio,
      velocity: normalizedVelocity * (to - sv.value),
    },
    onFinished
      ? finished => {
          "worklet";
          if (finished) {
            scheduleOnRN(onFinished);
          }
        }
      : undefined,
  );
};

export interface IContextMenuAnimator {
  backdropAnimatedStyle: AnimatedStyle<ViewStyle>;
  snapAnimatedStyle: AnimatedStyle<ViewStyle>;
  emojiAnimatedStyle: AnimatedStyle<ViewStyle>;
  actionsAnimatedStyle: AnimatedStyle<ViewStyle>;

  scrollOffset: SharedValue<number>;
  animateOpen: () => void;
  animateClose: (onFinished: () => void) => void;
}

export const useContextMenuAnimator = (
  layout: IContextMenuLayout,
  sourceFrame: IContextMenuRect,
): IContextMenuAnimator => {
  const {
    snapTarget,
    snapOrigin,
    emojiTarget,
    emojiOrigin,
    actionsTarget,
    actionsOrigin,
  } = layout;

  const backdropAlpha = useSharedValue(0);

  const snapDx = useSharedValue(snapOrigin.x - snapTarget.x);
  const snapDy = useSharedValue(snapOrigin.y - snapTarget.y);

  const emojiDy = useSharedValue(emojiOrigin.y - emojiTarget.y);
  const emojiScale = useSharedValue(CONTEXT_MENU_PANEL_SCALE);
  const emojiAlpha = useSharedValue(0);

  const actionsDy = useSharedValue(actionsOrigin.y - actionsTarget.y);
  const actionsScale = useSharedValue(CONTEXT_MENU_PANEL_SCALE);
  const actionsAlpha = useSharedValue(0);

  const scrollOffset = useSharedValue(layout.scrollOffset);

  const closeProgress = useSharedValue(0);

  const animateOpen = useCallback(() => {
    const open: ISpringSpec = {
      durationMs: OPEN_DURATION_MS,
      dampingRatio: OPEN_DAMPING,
      normalizedVelocity: OPEN_VELOCITY,
    };

    const openEmoji: ISpringSpec = {
      ...open,
      dampingRatio: OPEN_DAMPING - 0.1,
    };

    backdropAlpha.value = withTiming(1, {
      duration: OPEN_DURATION_MS * 0.55,
      easing: EASE_OUT,
    });

    springTo(snapDx, 0, open);
    springTo(snapDy, 0, open);

    if (layout.hasActions) {
      springTo(actionsDy, 0, open);
      springTo(actionsScale, 1, open);
      springTo(actionsAlpha, 1, open);
    }

    if (layout.hasEmoji) {
      springTo(emojiDy, 0, openEmoji);
      springTo(emojiScale, 1, openEmoji);
      springTo(emojiAlpha, 1, openEmoji);
    }
  }, [
    layout,
    backdropAlpha,
    snapDx,
    snapDy,
    emojiDy,
    emojiScale,
    emojiAlpha,
    actionsDy,
    actionsScale,
    actionsAlpha,
  ]);

  const animateClose = useCallback(
    (onFinished: () => void) => {
      const close: ISpringSpec = {
        durationMs: CLOSE_DURATION_MS,
        dampingRatio: CLOSE_DAMPING,
        normalizedVelocity: CLOSE_VELOCITY,
      };

      const returnX = sourceFrame.x;
      const returnY = sourceFrame.y + scrollOffset.value;

      backdropAlpha.value = withSpring(0, {
        duration: close.durationMs,
        dampingRatio: close.dampingRatio,
      });

      closeProgress.value = 0;
      springTo(closeProgress, 1, close, onFinished);

      springTo(snapDx, returnX - snapTarget.x, close);
      springTo(snapDy, returnY - snapTarget.y, close);

      if (layout.hasEmoji) {
        const emojiCloseY =
          returnY - emojiTarget.height - CONTEXT_MENU_PANEL_GAP;

        springTo(emojiDy, emojiCloseY - emojiTarget.y, close);
        springTo(emojiScale, CONTEXT_MENU_PANEL_SCALE, close);
        springTo(emojiAlpha, 0, close);
      }

      if (layout.hasActions) {
        const actionsCloseY =
          returnY + snapTarget.height + CONTEXT_MENU_PANEL_GAP;

        springTo(actionsDy, actionsCloseY - actionsTarget.y, close);
        springTo(actionsScale, CONTEXT_MENU_PANEL_SCALE, close);
        springTo(actionsAlpha, 0, close);
      }
    },
    [
      layout,
      sourceFrame,
      snapTarget,
      emojiTarget,
      actionsTarget,
      scrollOffset,
      closeProgress,
      backdropAlpha,
      snapDx,
      snapDy,
      emojiDy,
      emojiScale,
      emojiAlpha,
      actionsDy,
      actionsScale,
      actionsAlpha,
    ],
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropAlpha.value,
  }));

  const snapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: snapDx.value }, { translateY: snapDy.value }],
  }));

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emojiAlpha.value,
    transform: [{ translateY: emojiDy.value }, { scale: emojiScale.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsAlpha.value,
    transform: [{ translateY: actionsDy.value }, { scale: actionsScale.value }],
  }));

  return useMemo(
    () => ({
      backdropAnimatedStyle,
      snapAnimatedStyle,
      emojiAnimatedStyle,
      actionsAnimatedStyle,
      scrollOffset,
      animateOpen,
      animateClose,
    }),
    [
      backdropAnimatedStyle,
      snapAnimatedStyle,
      emojiAnimatedStyle,
      actionsAnimatedStyle,
      scrollOffset,
      animateOpen,
      animateClose,
    ],
  );
};
