import { IPullToRefreshController } from "@shared/lib/pull-to-refresh";
import { useTheme } from "@shared/lib/theme";
import { ISpinnerBehavior, Spinner, WORM_SPINNER_BEHAVIOR } from "@shared/ui";
import React, { FC, memo, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const INDICATOR_SIZE = 32;

/**
 * Дефолтный червяк кита со стартом с пика длины (initialPhase 0.5):
 * переход от заполненного протяжкой круга бесшовный, первое движение —
 * «конец стоит, начало уменьшается».
 */
const PTR_SPINNER_BEHAVIOR: ISpinnerBehavior = {
  ...WORM_SPINNER_BEHAVIOR,
  initialPhase: 0.5,
};

interface IProps {
  controller: IPullToRefreshController;
  /** Отступ сверху (высота navbar и т.п.) */
  topOffset?: number;
}

/**
 * Визуал pull-to-refresh страницы Main: плавающее кольцо поверх контента —
 * заполняется при протяжке (determinate), во время обновления — червяк.
 */
export const RefreshIndicator: FC<IProps> = memo(
  ({ controller, topOffset = 0 }) => {
    const { colors } = useTheme();
    const { pullDistance, progress, state } = controller;
    const [spinning, setSpinning] = useState(false);

    useAnimatedReaction(
      () => state.value,
      (current, previous) => {
        if (current === previous) {
          return;
        }

        // Червяк — только во время refreshing и на выезде после него;
        // settling отменённой протяжки (release до порога) остаётся
        // determinate-кольцом и уменьшается вслед за pullDistance.
        const isSpinning =
          current === "refreshing" ||
          (current === "settling" && previous === "refreshing");

        scheduleOnRN(setSpinning, isSpinning);
      },
    );

    const pullProgress = useDerivedValue(() => Math.min(1, progress.value));

    const containerStyle = useAnimatedStyle(() => ({
      // refreshing — всегда видим (индикатор удерживается на holdDistance);
      // pulling и settling — прозрачность следует за протяжкой: появляется
      // по мере натяжения и так же плавно затухает при возврате вверх.
      opacity: state.value === "refreshing" ? 1 : Math.min(1, progress.value),
      transform: [{ translateY: pullDistance.value - INDICATOR_SIZE * 2 }],
    }));

    return (
      <Animated.View
        pointerEvents={"none"}
        style={[
          ss.container,
          { top: topOffset, backgroundColor: colors.surface },
          containerStyle,
        ]}
      >
        {spinning ? (
          <Spinner size={INDICATOR_SIZE} behavior={PTR_SPINNER_BEHAVIOR} />
        ) : (
          <Spinner size={INDICATOR_SIZE} progress={pullProgress} />
        )}
      </Animated.View>
    );
  },
);

const ss = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
    alignSelf: "center",
    padding: 6,
    borderRadius: INDICATOR_SIZE,
  },
});
