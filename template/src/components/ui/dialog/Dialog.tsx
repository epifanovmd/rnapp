import { useTheme } from "@core";
import { Portal } from "@gorhom/portal";
import React, { memo, useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type AnimationType = "scale" | "slide" | "fade" | "scaleSlide";

export interface CenterModalProps extends ViewProps {
  isVisible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  backdropOpacity?: number;
  animationType?: AnimationType;
  animationDuration?: number;
  enableBackdropClose?: boolean;
  enableSwipeClose?: boolean;
  swipeDirection?: "up" | "down" | "left" | "right";
  swipeThreshold?: number; // Порог свайпа для закрытия (0-1)
  customBackdropColor?: string;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export const Dialog: React.FC<CenterModalProps> = memo(
  ({
    isVisible,
    onClose,
    children,
    width = "90%",
    height = "auto",
    backdropOpacity = 0.5,
    animationType = "scaleSlide",
    animationDuration = 300,
    enableBackdropClose = true,
    enableSwipeClose = true,
    swipeDirection = "down",
    swipeThreshold = 0.3,
    customBackdropColor,
    ...rest
  }) => {
    const { colors } = useTheme();

    const [isRenderDialog, setIsRenderDialog] = useState(false);
    const modalVisible = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const backdropColor =
      customBackdropColor || `rgba(0, 0, 0, ${backdropOpacity})`;

    const backdropAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        modalVisible.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
      };
    });

    const modalAnimatedStyle = useAnimatedStyle(() => {
      const scale =
        animationType === "scale" || animationType === "scaleSlide"
          ? interpolate(
              modalVisible.value,
              [0, 1],
              [0.7, 1],
              Extrapolation.CLAMP,
            )
          : 1;

      const baseTranslate =
        animationType === "slide" || animationType === "scaleSlide"
          ? interpolate(
              modalVisible.value,
              [0, 1],
              [
                swipeDirection === "left" || swipeDirection === "up" ? -50 : 50,
                0,
              ],
              Extrapolation.CLAMP,
            )
          : 0;

      const opacity = interpolate(
        modalVisible.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const isLeftOrRight =
        swipeDirection === "left" || swipeDirection === "right";
      const isTopOrBottom =
        swipeDirection === "up" || swipeDirection === "down";

      return {
        opacity: opacity,
        transform: [
          { scale },
          {
            translateY: isTopOrBottom
              ? baseTranslate + translateY.value
              : translateY.value,
          },
          {
            translateX: isLeftOrRight
              ? baseTranslate + translateX.value
              : translateX.value,
          },
        ],
      };
    });

    const openModal = (): void => {
      "worklet";
      runOnJS(setIsRenderDialog)(true);
      translateX.value = 0;
      translateY.value = 0;
      modalVisible.value = withTiming(1, {
        duration: animationDuration,
      });
    };

    const closeModal = (callback?: () => void): void => {
      "worklet";
      modalVisible.value = withTiming(
        0,
        {
          duration: animationDuration - 50,
        },
        () => {
          runOnJS(setIsRenderDialog)(false);
          if (callback) {
            runOnJS(callback)();
          }
        },
      );
    };

    const tapGesture = Gesture.Tap()
      .enabled(enableBackdropClose)
      .onEnd(() => {
        closeModal(onClose);
      });

    // Жест для модалки (свайп)
    const panGesture = Gesture.Pan()
      .enabled(enableSwipeClose)
      .onUpdate(event => {
        "worklet";
        const { translationX, translationY } = event;

        if (swipeDirection === "down" || swipeDirection === "up") {
          translateX.value = 0;
          translateY.value = translationY;
        } else if (swipeDirection === "left" || swipeDirection === "right") {
          translateX.value = translationX;
          translateY.value = 0;
        }
      })
      .onEnd(event => {
        "worklet";

        const { translationX, translationY, velocityY, velocityX } = event;

        const modalHeight =
          typeof height === "number" ? height : SCREEN_HEIGHT * 0.85;
        const modalWidth =
          typeof width === "number" ? width : SCREEN_WIDTH * 0.8;

        let shouldClose = false;

        // Проверяем условия для закрытия в зависимости от направления
        if (swipeDirection === "down") {
          const dragToss = 0.05;
          const endOffset = translationY + velocityY * dragToss;

          shouldClose =
            endOffset > modalHeight * swipeThreshold || velocityY > 500;
        } else if (swipeDirection === "up") {
          const dragToss = 0.05;
          const endOffset = translationY + velocityY * dragToss;

          shouldClose =
            endOffset < -modalHeight * swipeThreshold || velocityY < -500;
        } else if (swipeDirection === "left") {
          const dragToss = 0.05;
          const endOffset = translationX + velocityX * dragToss;

          shouldClose =
            endOffset < -modalWidth * swipeThreshold || velocityX < -500;
        } else if (swipeDirection === "right") {
          const dragToss = 0.05;
          const endOffset = translationX + velocityX * dragToss;

          shouldClose =
            endOffset > modalWidth * swipeThreshold || velocityX > 500;
        }

        if (shouldClose && onClose) {
          closeModal(onClose);
        } else {
          // Возвращаем модалку на место
          translateX.value = withTiming(0, { duration: 200 });
          translateY.value = withTiming(0, { duration: 200 });
        }
      });

    useEffect(() => {
      if (isVisible && !modalVisible.value) {
        Keyboard.dismiss();
        openModal();
      } else if (!isVisible && modalVisible.value) {
        closeModal();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // Рассчитываем стили для модалки
    const getModalStyle = (): StyleProp<ViewStyle> => {
      const baseStyle: ViewStyle = {
        backgroundColor: colors.surface,
      };

      // Ширина
      if (width) {
        baseStyle.width = width;
      }

      // Высота
      if (height !== "auto") {
        if (height) {
          baseStyle.height = height;
        }
      }

      // Ограничения
      baseStyle.maxWidth = "90%";
      baseStyle.maxHeight = "85%";

      return baseStyle;
    };

    // Не рендерим если модалка полностью скрыта
    if (!isRenderDialog) {
      return null;
    }

    return (
      <Portal name={"modal"} hostName={"modal"}>
        <View style={styles.container}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.gestureContainer}>
              <GestureDetector gesture={tapGesture}>
                <Animated.View
                  style={[
                    styles.backdrop,
                    { backgroundColor: backdropColor },
                    backdropAnimatedStyle,
                  ]}
                />
              </GestureDetector>

              <Animated.View
                {...rest}
                style={[
                  styles.modalContent,
                  getModalStyle(),
                  modalAnimatedStyle,
                  rest.style,
                ]}
              >
                {children}
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </Portal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  gestureContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    overflow: "hidden",
  },
});
