import { useCallback, useEffect, useState } from "react";
import {
  usePanGesture,
  usePinchGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import { useSharedValue, withDecay, withTiming } from "react-native-reanimated";
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
  doubleTapToZoomEnabled: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}

const PAN_RUBBER_FACTOR = 0.4;
/** Сопротивление зума за maxScale. */
const SCALE_RUBBER_FACTOR = 0.25;
/** Сопротивление зума ниже 1 (pinch-out). */
const SCALE_UNDER_RUBBER_FACTOR = 0.5;

/**
 * Зум-жесты слайда (SRP: только масштабирование/панорамирование, о
 * свайпе-закрытии не знает): pinch с фокальной привязкой, rubber за
 * пределами [1, maxScale] и ре-анкеровкой при смене пальцев; pan с границами
 * и инерцией при зуме; double-tap в точку. Вся математика — worklets.
 * Наружу отдаёт свои жесты, shared values трансформа и флаг pinchActive
 * (dismiss-жест уступает зуму по нему).
 */
export const useZoomGesture = ({
  containerWidth,
  containerHeight,
  contentWidth,
  contentHeight,
  maxScale,
  doubleTapScale,
  doubleTapToZoomEnabled,
  onZoomChange,
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
  /** e.scale в момент (ре-)анкеровки — масштаб считается относительно него. */
  const pinchAnchorScale = useSharedValue(1);
  /** Количество указателей последнего обработанного pinch-события. */
  const pinchPointers = useSharedValue(2);
  const pinchActive = useSharedValue(false);

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

  /** Rubber-сопротивление скейла за пределами [1, maxScale]. */
  const rubberScale = (value: number): number => {
    "worklet";

    if (value > maxScale) {
      return maxScale + (value - maxScale) * SCALE_RUBBER_FACTOR;
    }

    if (value < 1) {
      return 1 - (1 - value) * SCALE_UNDER_RUBBER_FACTOR;
    }

    return value;
  };

  const settle = (targetScale: number) => {
    "worklet";

    // Проекция translate под целевой скейл: контент под центром экрана
    // остаётся на месте — без этого возврат overshoot-зума уводил
    // изображение вбок (translate клэмпился от чужого масштаба).
    const factor = scale.value === 0 ? 1 : targetScale / scale.value;

    scale.value = withTiming(targetScale);
    translateX.value = withTiming(
      clamp(translateX.value * factor, boundX(targetScale)),
    );
    translateY.value = withTiming(
      clamp(translateY.value * factor, boundY(targetScale)),
    );
  };

  const pinchGesture = usePinchGesture({
    onActivate: event => {
      pinchActive.value = true;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      pinchFocalX.value = event.focalX;
      pinchFocalY.value = event.focalY;
      pinchAnchorScale.value = event.scale;
      pinchPointers.value = event.numberOfPointers;
    },
    onUpdate: event => {
      // При отпускании одного пальца RNGH шлёт update'ы с 1 указателем:
      // focal прыгает с центроида на оставшийся палец и утаскивает
      // изображение — такие события игнорируются.
      if (event.numberOfPointers !== 2) {
        pinchPointers.value = event.numberOfPointers;

        return;
      }

      // Возврат второго пальца (2→1→2): ре-анкеровка от текущего состояния,
      // иначе устаревший якорь фокала даёт скачок.
      if (pinchPointers.value !== 2) {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        pinchFocalX.value = event.focalX;
        pinchFocalY.value = event.focalY;
        pinchAnchorScale.value = event.scale;
        pinchPointers.value = 2;
      }

      // Масштаб относительно точки анкеровки (после ре-анкеровки e.scale
      // продолжает расти кумулятивно с начала жеста) + rubber за пределами.
      const ratio = event.scale / pinchAnchorScale.value;
      const nextScale = rubberScale(savedScale.value * ratio);
      // Привязка считается от фактического (rubbered) масштаба, чтобы
      // translate соответствовал тому, что рендерится.
      const effectiveRatio = nextScale / savedScale.value;

      // Фокальная привязка: точка под пальцами следует за ними
      // (двупальцевый pan включительно). Клэмп с сопротивлением сразу —
      // без него отпускание заметно «отпрыгивало» к границам.
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      const rawX =
        event.focalX -
        centerX -
        (pinchFocalX.value - centerX - savedTranslateX.value) * effectiveRatio;
      const rawY =
        event.focalY -
        centerY -
        (pinchFocalY.value - centerY - savedTranslateY.value) * effectiveRatio;

      scale.value = nextScale;
      translateX.value = rubberClamp(rawX, boundX(nextScale));
      translateY.value = rubberClamp(rawY, boundY(nextScale));
    },
    onDeactivate: () => {
      const target = Math.min(Math.max(scale.value, 1), maxScale);

      settle(target);
      scheduleOnRN(changeZoomed, target > 1);
    },
    onFinalize: () => {
      pinchActive.value = false;
    },
  });

  const panGesture = usePanGesture({
    enabled: zoomed,
    maxPointers: 1,
    onActivate: () => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    },
    onUpdate: event => {
      if (pinchActive.value) {
        return;
      }

      translateX.value = rubberClamp(
        savedTranslateX.value + event.translationX,
        boundX(scale.value),
      );
      translateY.value = rubberClamp(
        savedTranslateY.value + event.translationY,
        boundY(scale.value),
      );
    },
    onDeactivate: event => {
      if (pinchActive.value) {
        return;
      }

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
    },
  });

  const doubleTapGesture = useTapGesture({
    enabled: doubleTapToZoomEnabled,
    numberOfTaps: 2,
    maxDuration: 250,
    onActivate: event => {
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
    },
  });

  /** Сброс зума (уход со слайда, закрытие). */
  const reset = useCallback(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    pinchActive.value = false;
    setZoomed(false);
  }, [scale, translateX, translateY, pinchActive]);

  return {
    pinchGesture,
    panGesture,
    doubleTapGesture,
    scale,
    translateX,
    translateY,
    pinchActive,
    zoomed,
    reset,
  };
};
