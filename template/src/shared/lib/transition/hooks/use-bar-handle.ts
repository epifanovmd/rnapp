import { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { clamp, useSharedValue, withTiming } from "react-native-reanimated";

import { IBarHandle } from "../transition.types";

const DURATION = 250;

/**
 * Состояние видимости одного бара. Пока высота не измерена (0),
 * hide/snap/shift — no-op: бар нельзя спрятать на неизвестную величину.
 */
export const useBarHandle = (): IBarHandle => {
  const [height, setHeight] = useState(0);
  const offset = useSharedValue(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  return useMemo(() => {
    const show = () => {
      "worklet";
      offset.value = withTiming(0, { duration: DURATION });
    };

    const hide = () => {
      "worklet";
      if (height) {
        offset.value = withTiming(height, { duration: DURATION });
      }
    };

    const snap = () => {
      "worklet";
      if (height) {
        offset.value = withTiming(offset.value > height / 2 ? height : 0, {
          duration: DURATION,
        });
      }
    };

    const shift = (delta: number) => {
      "worklet";
      if (height) {
        offset.value = clamp(offset.value + delta, 0, height);
      }
    };

    return { height, offset, show, hide, snap, shift, setHeight, onLayout };
  }, [height, offset, onLayout]);
};
