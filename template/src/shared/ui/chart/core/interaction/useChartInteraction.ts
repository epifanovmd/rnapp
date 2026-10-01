import { useCallback, useMemo } from "react";
import {
  GestureStateManager,
  GestureTouchEvent,
  State,
  TouchData,
  usePanGesture,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import type { ChartDimensions } from "../types";

/** Опции useChartInteraction. */
export interface ChartInteractionOptions {
  enabled?: boolean;
  minDistance?: number;
  activeOffsetX?: number | [number, number];
  failOffsetY?: number | [number, number];
  /** Отслеживать второй палец (`touchX2`/`isSecondActive`). По умолчанию `false`. */
  twoFingerEnabled?: boolean;
}

export type ChartGesture = ReturnType<typeof usePanGesture>;

export interface ChartInteraction {
  touchX: ReturnType<typeof useSharedValue<number>>;
  touchY: ReturnType<typeof useSharedValue<number>>;
  isActive: ReturnType<typeof useSharedValue<boolean>>;
  touchX2: ReturnType<typeof useSharedValue<number>>;
  touchY2: ReturnType<typeof useSharedValue<number>>;
  isSecondActive: ReturnType<typeof useSharedValue<boolean>>;
  gesture: ChartGesture;
}

const NO_TOUCH = -1;

/** Хук жестов графика: pan, multi-touch, позиции касаний. */
export const useChartInteraction = (
  dimensions: ChartDimensions,
  options: ChartInteractionOptions = {},
): ChartInteraction => {
  const {
    enabled = true,
    minDistance = 0,
    activeOffsetX,
    failOffsetY,
    twoFingerEnabled = false,
  } = options;

  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const touchX2 = useSharedValue(0);
  const touchY2 = useSharedValue(0);
  const isSecondActive = useSharedValue(false);

  const primaryTouchId = useSharedValue(NO_TOUCH);
  const secondaryTouchId = useSharedValue(NO_TOUCH);

  const { padding, width, height } = dimensions;

  const bounds = useMemo(() => {
    const minX = padding.left;
    const minY = padding.top;

    return {
      minX,
      maxX: Math.max(width - padding.right, minX),
      minY,
      maxY: Math.max(height - padding.bottom, minY),
    };
  }, [padding.left, padding.right, padding.top, padding.bottom, width, height]);

  const resetSlots = useCallback(() => {
    "worklet";

    primaryTouchId.value = NO_TOUCH;
    secondaryTouchId.value = NO_TOUCH;
    isActive.value = false;
    isSecondActive.value = false;
  }, [primaryTouchId, secondaryTouchId, isActive, isSecondActive]);

  /** Сверяет слоты с фактическим списком пальцев: освобождает ушедшие, назначает новые. */
  const syncSlots = useCallback(
    (touches: TouchData[]) => {
      "worklet";

      const hasTouch = (id: number) => touches.some(touch => touch.id === id);

      if (
        primaryTouchId.value !== NO_TOUCH &&
        !hasTouch(primaryTouchId.value)
      ) {
        primaryTouchId.value = NO_TOUCH;
      }

      if (
        secondaryTouchId.value !== NO_TOUCH &&
        !hasTouch(secondaryTouchId.value)
      ) {
        secondaryTouchId.value = NO_TOUCH;
      }

      if (
        primaryTouchId.value === NO_TOUCH &&
        secondaryTouchId.value !== NO_TOUCH
      ) {
        primaryTouchId.value = secondaryTouchId.value;
        secondaryTouchId.value = NO_TOUCH;
      }

      for (const touch of touches) {
        if (
          touch.id === primaryTouchId.value ||
          touch.id === secondaryTouchId.value
        ) {
          continue;
        }

        if (primaryTouchId.value === NO_TOUCH) {
          primaryTouchId.value = touch.id;
        } else if (twoFingerEnabled && secondaryTouchId.value === NO_TOUCH) {
          secondaryTouchId.value = touch.id;
        }
      }
    },
    [primaryTouchId, secondaryTouchId, twoFingerEnabled],
  );

  const applyPositions = useCallback(
    (touches: TouchData[]) => {
      "worklet";

      syncSlots(touches);

      const primaryTouch = touches.find(
        touch => touch.id === primaryTouchId.value,
      );
      const secondaryTouch = touches.find(
        touch => touch.id === secondaryTouchId.value,
      );

      if (primaryTouch) {
        touchX.value = Math.min(
          Math.max(primaryTouch.x, bounds.minX),
          bounds.maxX,
        );
        touchY.value = Math.min(
          Math.max(primaryTouch.y, bounds.minY),
          bounds.maxY,
        );
        isActive.value = true;
      } else {
        isActive.value = false;
      }

      if (secondaryTouch) {
        touchX2.value = Math.min(
          Math.max(secondaryTouch.x, bounds.minX),
          bounds.maxX,
        );
        touchY2.value = Math.min(
          Math.max(secondaryTouch.y, bounds.minY),
          bounds.maxY,
        );
        isSecondActive.value = true;
      } else {
        isSecondActive.value = false;
      }
    },
    [
      syncSlots,
      primaryTouchId,
      secondaryTouchId,
      touchX,
      touchY,
      touchX2,
      touchY2,
      isActive,
      isSecondActive,
      bounds,
    ],
  );

  const onTouchesDown = useCallback(
    (event: GestureTouchEvent) => {
      "worklet";

      applyPositions(event.allTouches);

      // Второй палец сдвигает центроид pan-жеста: до активации это валит жест по
      // failOffsetY и отдаёт касание родительскому скроллу. Активируем явно.
      if (isSecondActive.value && event.state !== State.ACTIVE) {
        GestureStateManager.activate(event.handlerTag);
      }
    },
    [applyPositions, isSecondActive],
  );

  const onTouchesMove = useCallback(
    (event: GestureTouchEvent) => {
      "worklet";

      applyPositions(event.allTouches);
    },
    [applyPositions],
  );

  const onTouchesUp = useCallback(
    (event: GestureTouchEvent) => {
      "worklet";

      // allTouches в событии отпускания ещё содержит поднятые пальцы.
      applyPositions(
        event.allTouches.filter(
          touch =>
            !event.changedTouches.some(changed => changed.id === touch.id),
        ),
      );
    },
    [applyPositions],
  );

  const useDirectionalOffsets =
    activeOffsetX !== undefined || failOffsetY !== undefined;

  const gesture = usePanGesture({
    enabled,
    minPointers: 1,
    maxPointers: twoFingerEnabled ? 2 : 1,
    minDistance: useDirectionalOffsets ? undefined : minDistance,
    activeOffsetX: useDirectionalOffsets ? activeOffsetX : undefined,
    failOffsetY: useDirectionalOffsets ? failOffsetY : undefined,
    onTouchesDown,
    onTouchesMove,
    onTouchesUp,
    onTouchesCancel: resetSlots,
    onFinalize: resetSlots,
  });

  return {
    touchX,
    touchY,
    isActive,
    touchX2,
    touchY2,
    isSecondActive,
    gesture,
  };
};
