import { useCallback } from "react";
import { usePanGesture } from "react-native-gesture-handler";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export interface IDismissGestureOptions {
  containerHeight: number;
  /** Жест активен (обычно `!zoomed && swipeToCloseEnabled`). */
  enabled: boolean;
  /** Активность pinch-зума — смахивание уступает ему и сбрасывается. */
  pinchActive: SharedValue<boolean>;
  /** 0..1 — прогресс закрытия (фон/бары читают его в родителе). */
  dismissProgress: SharedValue<number>;
  onDismiss?: () => void;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
const RETURN_DURATION = 220;
const COMMIT_DURATION = 200;

/**
 * Смахивание для закрытия (SRP: о зуме не знает, кроме уступания по
 * pinchActive): вертикальный pan с собственным translateY — за значения
 * с зумом не конкурирует. Прогресс пишется в dismissProgress, прозрачность
 * слайда гаснет только при подтверждённом закрытии.
 */
export const useDismissGesture = ({
  containerHeight,
  enabled,
  pinchActive,
  dismissProgress,
  onDismiss,
}: IDismissGestureOptions) => {
  /** Собственная вертикальная ось смахивания (не смешивается с зумом). */
  const translateY = useSharedValue(0);
  const dismissing = useSharedValue(false);
  /** Прозрачность слайда: в ноль — только при подтверждённом закрытии. */
  const itemOpacity = useSharedValue(1);

  // Начатое смахивание уступает зуму: как только pinch активировался —
  // плавный сброс собственного смещения и прогресса.
  useAnimatedReaction(
    () => pinchActive.value,
    (isPinching, wasPinching) => {
      if (isPinching && !wasPinching && translateY.value !== 0) {
        translateY.value = withTiming(0, { duration: RETURN_DURATION });
        dismissProgress.value = withTiming(0, { duration: RETURN_DURATION });
      }
    },
  );

  const gesture = usePanGesture({
    enabled,
    maxPointers: 1,
    // Горизонталь принадлежит пейджеру, вертикаль — закрытию.
    activeOffsetY: [-12, 12],
    failOffsetX: [-8, 8],
    onUpdate: event => {
      if (pinchActive.value) {
        return;
      }

      // Прогресс на полную высоту экрана: затемнение реагирует плавно,
      // фон не исчезает целиком на реалистичных дистанциях свайпа.
      translateY.value = event.translationY;
      dismissProgress.value = Math.min(
        1,
        Math.abs(event.translationY) / containerHeight,
      );
    },
    onDeactivate: event => {
      if (pinchActive.value) {
        return;
      }

      const shouldDismiss =
        Math.abs(event.translationY) > DISMISS_DISTANCE ||
        Math.abs(event.velocityY) > DISMISS_VELOCITY;

      if (shouldDismiss && onDismiss) {
        dismissing.value = true;

        const direction = event.translationY >= 0 ? 1 : -1;

        dismissProgress.value = withTiming(1, { duration: COMMIT_DURATION });
        itemOpacity.value = withTiming(0, { duration: COMMIT_DURATION });
        translateY.value = withTiming(
          direction * containerHeight,
          { duration: COMMIT_DURATION },
          finished => {
            if (finished) {
              scheduleOnRN(onDismiss);
            }
          },
        );
      }
    },
    // Возврат и при обычном завершении, и при отмене жеста (cancel не
    // вызывает onDeactivate — без этого изображение зависало смещённым).
    onFinalize: () => {
      if (!dismissing.value && !pinchActive.value) {
        translateY.value = withTiming(0, { duration: RETURN_DURATION });
        dismissProgress.value = withTiming(0, { duration: RETURN_DURATION });
      }
    },
  });

  /** Сброс (уход со слайда, закрытие). */
  const reset = useCallback(() => {
    translateY.value = 0;
    dismissProgress.value = 0;
    dismissing.value = false;
    itemOpacity.value = 1;
  }, [translateY, dismissProgress, dismissing, itemOpacity]);

  return { gesture, translateY, itemOpacity, reset };
};
