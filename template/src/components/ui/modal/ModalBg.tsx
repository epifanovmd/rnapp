import {
  BottomSheetBackdropProps,
  useBottomSheet,
  useBottomSheetGestureHandlers,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { memo, useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

export const ModalBackdrop = memo(
  ({ animatedIndex, style }: BottomSheetBackdropProps) => {
    const { handlePanGestureHandler } = useBottomSheetGestureHandlers();
    const { snapToIndex, close } = useBottomSheet();

    const {
      activeOffsetX,
      activeOffsetY,
      failOffsetX,
      failOffsetY,
      waitFor,
      simultaneousHandlers,
    } = useBottomSheetInternal();

    // Пан-жест (свайп)
    const panGesture = useMemo(() => {
      let gesture = Gesture.Pan()
        .enabled(true)
        .shouldCancelWhenOutside(false)
        .onStart(handlePanGestureHandler.handleOnStart)
        .onChange(handlePanGestureHandler.handleOnChange)
        .onEnd(handlePanGestureHandler.handleOnEnd)
        .onFinalize(handlePanGestureHandler.handleOnFinalize);

      if (waitFor) {
        gesture = gesture.requireExternalGestureToFail(waitFor);
      }

      if (simultaneousHandlers) {
        gesture = gesture.simultaneousWithExternalGesture(
          simultaneousHandlers as never,
        );
      }

      if (activeOffsetX) {
        gesture = gesture.activeOffsetX(activeOffsetX);
      }

      if (activeOffsetY) {
        gesture = gesture.activeOffsetY(activeOffsetY);
      }

      if (failOffsetX) {
        gesture = gesture.failOffsetX(failOffsetX);
      }

      if (failOffsetY) {
        gesture = gesture.failOffsetY(failOffsetY);
      }

      return gesture;
    }, [
      activeOffsetX,
      activeOffsetY,
      failOffsetX,
      failOffsetY,
      simultaneousHandlers,
      waitFor,
      handlePanGestureHandler.handleOnChange,
      handlePanGestureHandler.handleOnEnd,
      handlePanGestureHandler.handleOnFinalize,
      handlePanGestureHandler.handleOnStart,
    ]);

    // Тап-жест (для закрытия)
    const tapGesture = useMemo(() => {
      return Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          close(); // закрываем модалку
        });
    }, [close]);

    // Объединённый жест: если был свайп — пускай свайп, если тап — закрываем
    const combinedGesture = useMemo(() => {
      return Gesture.Race(panGesture, tapGesture);
    }, [panGesture, tapGesture]);

    // Анимация прозрачности
    const containerAnimatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.value,
        [-1, 0, 1],
        [0, 0.5, 0.5],
        Extrapolation.CLAMP,
      ),
    }));

    // Стили
    const containerStyle = useMemo(
      () => [
        style,
        {
          backgroundColor: "rgba(0, 0, 0, 0.5)", // можно заменить на "red", если хочешь
        },
        containerAnimatedStyle,
      ],
      [style, containerAnimatedStyle],
    );

    return (
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={containerStyle} />
      </GestureDetector>
    );
  },
);
