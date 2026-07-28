import { usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import type { ChartDimensions } from "../types";

export interface ChartInteractionOptions {
  enabled?: boolean;
  minDistance?: number;
}

export interface ChartInteraction {
  touchX: ReturnType<typeof useSharedValue<number>>;
  touchY: ReturnType<typeof useSharedValue<number>>;
  isActive: ReturnType<typeof useSharedValue<boolean>>;
  gesture: ReturnType<typeof usePanGesture>;
}

export const useChartInteraction = (
  dimensions: ChartDimensions,
  options: ChartInteractionOptions = {},
): ChartInteraction => {
  const { enabled = true, minDistance = 0 } = options;

  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const { padding, width, height } = dimensions;
  const minX = padding.left;
  const maxX = Math.max(width - padding.right, minX);
  const minY = padding.top;
  const maxY = Math.max(height - padding.bottom, minY);

  const updatePosition = (x: number, y: number) => {
    "worklet";

    touchX.value = Math.min(Math.max(x, minX), maxX);
    touchY.value = Math.min(Math.max(y, minY), maxY);
  };

  const gesture = usePanGesture({
    enabled,
    minDistance,
    onBegin: event => {
      isActive.value = true;
      updatePosition(event.x, event.y);
    },
    onUpdate: event => {
      updatePosition(event.x, event.y);
    },
    onFinalize: () => {
      isActive.value = false;
    },
  });

  return { touchX, touchY, isActive, gesture };
};
