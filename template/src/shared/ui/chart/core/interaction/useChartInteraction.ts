import { usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import type { ChartDimensions } from "../types";

export interface ChartInteractionOptions {
  enabled?: boolean;
  minDistance?: number;
  activeOffsetX?: number | [number, number];
  failOffsetY?: number | [number, number];
  twoFingerEnabled?: boolean;
}

export interface ChartInteraction {
  touchX: ReturnType<typeof useSharedValue<number>>;
  touchY: ReturnType<typeof useSharedValue<number>>;
  isActive: ReturnType<typeof useSharedValue<boolean>>;
  touchX2: ReturnType<typeof useSharedValue<number>>;
  touchY2: ReturnType<typeof useSharedValue<number>>;
  isSecondActive: ReturnType<typeof useSharedValue<boolean>>;
  gesture: ReturnType<typeof usePanGesture>;
}

export const useChartInteraction = (
  dimensions: ChartDimensions,
  options: ChartInteractionOptions = {},
): ChartInteraction => {
  const {
    enabled = true,
    minDistance = 0,
    activeOffsetX,
    failOffsetY,
    twoFingerEnabled = true,
  } = options;

  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const touchX2 = useSharedValue(0);
  const touchY2 = useSharedValue(0);
  const isSecondActive = useSharedValue(false);

  const { padding, width, height } = dimensions;
  const minX = padding.left;
  const maxX = Math.max(width - padding.right, minX);
  const minY = padding.top;
  const maxY = Math.max(height - padding.bottom, minY);

  const applyTouches = (touches: { x: number; y: number }[]) => {
    "worklet";

    if (touches.length === 0) {
      isActive.value = false;
      isSecondActive.value = false;

      return;
    }

    const [first, second] = touches;

    touchX.value = Math.min(Math.max(first.x, minX), maxX);
    touchY.value = Math.min(Math.max(first.y, minY), maxY);
    isActive.value = true;

    if (second) {
      touchX2.value = Math.min(Math.max(second.x, minX), maxX);
      touchY2.value = Math.min(Math.max(second.y, minY), maxY);
      isSecondActive.value = true;
    } else {
      isSecondActive.value = false;
    }
  };

  const useDirectionalOffsets =
    activeOffsetX !== undefined || failOffsetY !== undefined;

  const gesture = usePanGesture({
    enabled,
    minPointers: 1,
    maxPointers: twoFingerEnabled ? 2 : 1,
    minDistance: useDirectionalOffsets ? undefined : minDistance,
    activeOffsetX: useDirectionalOffsets ? activeOffsetX : undefined,
    failOffsetY: useDirectionalOffsets ? failOffsetY : undefined,
    onTouchesDown: event => {
      applyTouches(event.allTouches);
    },
    onTouchesMove: event => {
      applyTouches(event.allTouches);
    },
    onTouchesUp: event => {
      applyTouches(event.allTouches);
    },
    onTouchesCancel: () => {
      isActive.value = false;
      isSecondActive.value = false;
    },
    onFinalize: () => {
      isActive.value = false;
      isSecondActive.value = false;
    },
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
