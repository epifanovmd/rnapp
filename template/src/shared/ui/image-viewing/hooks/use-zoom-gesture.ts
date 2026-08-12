import { useCallback, useEffect, useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export interface IZoomGestureOptions {
  /** Размер контейнера слайда (обычно окно). */
  containerWidth: number;
  containerHeight: number;
  /** Отображаемый contain-fit размер контента при scale 1 (для клэмпа границ). */
  contentWidth: number;
  contentHeight: number;
  maxScale: number;
  doubleTapScale: number;
  swipeToCloseEnabled: boolean;
  doubleTapToZoomEnabled: boolean;
  /** 0..1 — прогресс свайпа-закрытия (фон/бары читают его в родителе). */
  dismissProgress: SharedValue<number>;
  onZoomChange?: (zoomed: boolean) => void;
  onSingleTap?: () => void;
  onLongPress?: () => void;
  onDismiss?: () => void;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
const DISMISS_SCALE_SHRINK = 0.2;
const PAN_RUBBER_FACTOR = 0.4;
const LONG_PRESS_DURATION = 500;

/**
 * Жестовое ядро зум-вьюера: pinch с фокальной привязкой, pan (панорамирование
 * при зуме / vertical swipe-to-dismiss без зума), double-tap в точку,
 * single-tap, long-press. Вся математика — worklets на UI-потоке; JS
 * уведомляется только о смене zoom-состояния и терминальных событиях.
 * Конфликт pinch и pan за translateY разрешается флагом `pinchActive`
 * внутри worklet'ов — пишет всегда ровно один жест.
 */
export const useZoomGesture = ({
  containerWidth,
  containerHeight,
  contentWidth,
  contentHeight,
  maxScale,
  doubleTapScale,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  dismissProgress,
  onZoomChange,
  onSingleTap,
  onLongPress,
  onDismiss,
}: IZoomGestureOptions) => {
  const [zoomed, setZoomed] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);
  const pinchFocalY = useSharedValue(0);
  const pinchActive = useSharedValue(false);
  const dismissing = useSharedValue(false);
  /** Прозрачность слайда: гаснет только при подтверждённом закрытии. */
  const itemOpacity = useSharedValue(1);

  // Размеры контента — shared values: догрузка изображения не пересобирает
  // жесты (пересборка посреди pinch срывала жест).
  const contentW = useSharedValue(contentWidth);
  const contentH = useSharedValue(contentHeight);

  useEffect(() => {
    contentW.value = contentWidth;
    contentH.value = contentHeight;
  }, [contentWidth, contentHeight, contentW, contentH]);

  const changeZoomed = useCallback(
    (value: boolean) => {
      setZoomed(value);
      onZoomChange?.(value);
    },
    [onZoomChange],
  );

  const gesture = useMemo(() => {
    const boundX = (atScale: number): number => {
      "worklet";

      return Math.max(0, (contentW.value * atScale - containerWidth) / 2);
    };

    const boundY = (atScale: number): number => {
      "worklet";

      return Math.max(0, (contentH.value * atScale - containerHeight) / 2);
    };

    const clamp = (value: number, bound: number): number => {
      "worklet";

      return Math.min(Math.max(value, -bound), bound);
    };

    /** Клэмп с сопротивлением за границей. */
    const rubberClamp = (value: number, bound: number): number => {
      "worklet";

      if (value > bound) {
        return bound + (value - bound) * PAN_RUBBER_FACTOR;
      }

      if (value < -bound) {
        return -bound + (value + bound) * PAN_RUBBER_FACTOR;
      }

      return value;
    };

    const settle = (targetScale: number) => {
      "worklet";

      scale.value = withTiming(targetScale);
      translateX.value = withTiming(
        clamp(translateX.value, boundX(targetScale)),
      );
      translateY.value = withTiming(
        clamp(translateY.value, boundY(targetScale)),
      );
    };

    const pinch = Gesture.Pinch()
      .onStart(event => {
        pinchActive.value = true;
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        pinchFocalX.value = event.focalX;
        pinchFocalY.value = event.focalY;
        // Начатый свайп-закрытие уступает зуму.
        dismissProgress.value = withTiming(0);
      })
      .onUpdate(event => {
        const nextScale = savedScale.value * event.scale;

        scale.value = nextScale;

        // Фокальная привязка: точка под пальцами следует за ними
        // (двупальцевый pan включительно). Клэмп с сопротивлением сразу —
        // без него отпускание заметно «отпрыгивало» к границам.
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        translateX.value = rubberClamp(
          event.focalX -
            centerX -
            (pinchFocalX.value - centerX - savedTranslateX.value) * event.scale,
          boundX(nextScale),
        );
        translateY.value = rubberClamp(
          event.focalY -
            centerY -
            (pinchFocalY.value - centerY - savedTranslateY.value) * event.scale,
          boundY(nextScale),
        );
      })
      .onEnd(() => {
        const target = Math.min(Math.max(scale.value, 1), maxScale);

        settle(target);
        scheduleOnRN(changeZoomed, target > 1);
      })
      .onFinalize(() => {
        pinchActive.value = false;
      });

    let pan = Gesture.Pan()
      .enabled(zoomed || swipeToCloseEnabled)
      .maxPointers(1)
      .onStart(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate(event => {
        if (pinchActive.value) {
          return;
        }

        if (zoomed) {
          translateX.value = rubberClamp(
            savedTranslateX.value + event.translationX,
            boundX(scale.value),
          );
          translateY.value = rubberClamp(
            savedTranslateY.value + event.translationY,
            boundY(scale.value),
          );

          return;
        }

        translateY.value = savedTranslateY.value + event.translationY;
        // Прогресс на полную высоту экрана: затемнение реагирует плавно,
        // фон не исчезает целиком на реалистичных дистанциях свайпа.
        dismissProgress.value = Math.min(
          1,
          Math.abs(event.translationY) / containerHeight,
        );
      })
      .onEnd(event => {
        if (pinchActive.value) {
          return;
        }

        if (zoomed) {
          const bx = boundX(scale.value);
          const by = boundY(scale.value);

          if (Math.abs(translateX.value) > bx) {
            translateX.value = withTiming(clamp(translateX.value, bx));
          } else {
            translateX.value = withDecay({
              velocity: event.velocityX,
              clamp: [-bx, bx],
            });
          }

          if (Math.abs(translateY.value) > by) {
            translateY.value = withTiming(clamp(translateY.value, by));
          } else {
            translateY.value = withDecay({
              velocity: event.velocityY,
              clamp: [-by, by],
            });
          }

          return;
        }

        const shouldDismiss =
          Math.abs(event.translationY) > DISMISS_DISTANCE ||
          Math.abs(event.velocityY) > DISMISS_VELOCITY;

        if (shouldDismiss && onDismiss) {
          dismissing.value = true;

          const direction = event.translationY >= 0 ? 1 : -1;

          dismissProgress.value = withTiming(1, { duration: 200 });
          itemOpacity.value = withTiming(0, { duration: 200 });
          translateY.value = withTiming(
            direction * containerHeight,
            { duration: 200 },
            finished => {
              if (finished) {
                scheduleOnRN(onDismiss);
              }
            },
          );
        }
      })
      // Возврат и при обычном завершении, и при отмене жеста (cancel не
      // вызывает onEnd — без этого изображение зависало смещённым).
      .onFinalize(() => {
        if (!zoomed && !dismissing.value && !pinchActive.value) {
          translateY.value = withTiming(0, { duration: 220 });
          dismissProgress.value = withTiming(0, { duration: 220 });
        }
      });

    if (!zoomed) {
      // Без зума горизонталь принадлежит пейджеру, вертикаль — закрытию.
      pan = pan.activeOffsetY([-12, 12]).failOffsetX([-8, 8]);
    }

    const doubleTap = Gesture.Tap()
      .enabled(doubleTapToZoomEnabled)
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(event => {
        if (scale.value > 1) {
          scale.value = withTiming(1);
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          scheduleOnRN(changeZoomed, false);

          return;
        }

        // Точка тапа остаётся на месте: t = p * (1 - s).
        const target = doubleTapScale;
        const pointX = event.x - containerWidth / 2;
        const pointY = event.y - containerHeight / 2;

        scale.value = withTiming(target);
        translateX.value = withTiming(
          clamp(pointX * (1 - target), boundX(target)),
        );
        translateY.value = withTiming(
          clamp(pointY * (1 - target), boundY(target)),
        );
        scheduleOnRN(changeZoomed, true);
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        if (onSingleTap) {
          scheduleOnRN(onSingleTap);
        }
      });

    const longPress = Gesture.LongPress()
      .minDuration(LONG_PRESS_DURATION)
      .onStart(() => {
        if (onLongPress) {
          scheduleOnRN(onLongPress);
        }
      });

    return Gesture.Simultaneous(
      pinch,
      pan,
      Gesture.Exclusive(doubleTap, singleTap),
      longPress,
    );
  }, [
    zoomed,
    containerWidth,
    containerHeight,
    maxScale,
    doubleTapScale,
    swipeToCloseEnabled,
    doubleTapToZoomEnabled,
    dismissProgress,
    changeZoomed,
    onSingleTap,
    onLongPress,
    onDismiss,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    pinchFocalX,
    pinchFocalY,
    pinchActive,
    dismissing,
    itemOpacity,
    contentW,
    contentH,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    // При перетаскивании фото гаснет мягко (floor 0.4), при подтверждённом
    // закрытии itemOpacity уводит его в ноль.
    opacity: Math.min(itemOpacity.value, 1 - dismissProgress.value * 0.6),
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        scale: scale.value * (1 - DISMISS_SCALE_SHRINK * dismissProgress.value),
      },
    ],
  }));

  /** Сброс зума (уход со слайда, закрытие). */
  const reset = useCallback(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    dismissProgress.value = 0;
    dismissing.value = false;
    itemOpacity.value = 1;
    setZoomed(false);
  }, [scale, translateX, translateY, dismissProgress, dismissing, itemOpacity]);

  return { gesture, animatedStyle, zoomed, reset };
};
