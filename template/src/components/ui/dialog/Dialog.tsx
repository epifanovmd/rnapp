import { useTheme } from "@core";
import { Portal } from "@gorhom/portal";
import React, {
  memo,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DIALOG_HOST_NAME, DialogHost } from "./DialogHost";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export type AnimationType = "scale" | "slide" | "fade" | "scaleSlide";
export type PlacementType = "top" | "center" | "bottom";

export interface CenterModalProps extends ViewProps {
  isVisible: boolean;
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  offset?: number;
  placement?: PlacementType;
  animationType?: AnimationType;
  animationDuration?: number;
  animationDirection?: "up" | "down" | "left" | "right";
  enableBackdropClose?: boolean;
  enableSwipeClose?: boolean;
  swipeThreshold?: number;
  backdropOpacity?: number;
  backdropColor?: string;
  onClose?: () => void;
}

const _Dialog: React.FC<PropsWithChildren<CenterModalProps>> = memo(
  ({
    isVisible,
    width = "85%",
    height = "auto",
    offset = 50,
    placement = "center",
    animationType = "slide",
    animationDuration: duration = 250,
    animationDirection = "down",
    enableBackdropClose = true,
    enableSwipeClose = true,
    swipeThreshold = 0.3,
    backdropOpacity = 0.6,
    backdropColor = "#000000",
    onClose,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();
    const { top, bottom } = useSafeAreaInsets();

    const [isRenderDialog, setIsRenderDialog] = useState(false);
    const modalVisible = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const backdropAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        modalVisible.value,
        [0, 1],
        [0, backdropOpacity],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
        backgroundColor: backdropColor,
      };
    }, [backdropColor]);

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

      // Базовое смещение для анимации появления
      let baseTranslate = 0;

      if (animationType === "slide" || animationType === "scaleSlide") {
        baseTranslate = interpolate(
          modalVisible.value,
          [0, 1],
          [
            animationDirection === "left" || animationDirection === "up"
              ? -50
              : 50,
            0,
          ],
          Extrapolation.CLAMP,
        );
      }

      const opacity = interpolate(
        modalVisible.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const isLeftOrRight =
        animationDirection === "left" || animationDirection === "right";
      const isTopOrBottom =
        animationDirection === "up" || animationDirection === "down";

      return {
        opacity,
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
        duration,
      });
    };

    const closeModal = (callback?: () => void): void => {
      "worklet";
      modalVisible.value = withTiming(
        0,
        {
          duration,
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

        if (animationDirection === "down" || animationDirection === "up") {
          translateX.value = 0;
          translateY.value = translationY;
        } else if (
          animationDirection === "left" ||
          animationDirection === "right"
        ) {
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
        if (animationDirection === "down") {
          const dragToss = 0.05;
          const endOffset = translationY + velocityY * dragToss;

          shouldClose =
            endOffset > modalHeight * swipeThreshold || velocityY > 500;
        } else if (animationDirection === "up") {
          const dragToss = 0.05;
          const endOffset = translationY + velocityY * dragToss;

          shouldClose =
            endOffset < -modalHeight * swipeThreshold || velocityY < -500;
        } else if (animationDirection === "left") {
          const dragToss = 0.05;
          const endOffset = translationX + velocityX * dragToss;

          shouldClose =
            endOffset < -modalWidth * swipeThreshold || velocityX < -500;
        } else if (animationDirection === "right") {
          const dragToss = 0.05;
          const endOffset = translationX + velocityX * dragToss;

          shouldClose =
            endOffset > modalWidth * swipeThreshold || velocityX > 500;
        }

        if (shouldClose && onClose) {
          closeModal(onClose);
        } else {
          // Возвращаем модалку на место
          translateX.value = withTiming(0, { duration });
          translateY.value = withTiming(0, { duration });
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

    // Рассчитываем стили для модалки с учетом placement
    const contentStyle = useMemo<StyleProp<ViewStyle>>(() => {
      const baseStyle: ViewStyle = {
        backgroundColor: colors.surface,
        width,
        height,
      };

      // Ограничения
      baseStyle.maxWidth = "90%";
      baseStyle.maxHeight = "85%";

      return [styles.content, baseStyle];
    }, [colors.surface, height, width]);

    // Стиль контейнера для размещения
    const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(() => {
      const baseStyle = {
        paddingTop: top || offset,
        paddingBottom: bottom || offset,
      };

      switch (placement) {
        case "top":
          return [baseStyle, styles.topContainer];
        case "bottom":
          return [baseStyle, styles.bottomContainer];
        case "center":
        default:
          return [baseStyle, styles.centerContainer];
      }
    }, [bottom, offset, placement, top]);

    // Не рендерим если модалка полностью скрыта
    if (!isRenderDialog) {
      return null;
    }

    return (
      <Portal hostName={DIALOG_HOST_NAME}>
        <View style={styles.container}>
          <GestureDetector gesture={panGesture}>
            <View style={contentContainerStyle}>
              <GestureDetector gesture={tapGesture}>
                <Animated.View
                  style={[styles.backdrop, backdropAnimatedStyle]}
                />
              </GestureDetector>

              <Animated.View
                {...rest}
                style={[contentStyle, modalAnimatedStyle, rest.style]}
              >
                {children}
              </Animated.View>
            </View>
          </GestureDetector>
        </View>
      </Portal>
    );
  },
);

export const Dialog = Object.assign(_Dialog, { Host: DialogHost });

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    overflow: "hidden",
    padding: 16,
    borderRadius: 16,
  },
});
