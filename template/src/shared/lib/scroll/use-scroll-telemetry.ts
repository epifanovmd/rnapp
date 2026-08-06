import { useMemo } from "react";
import { NativeScrollEvent } from "react-native";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import {
  IScrollTelemetry,
  IScrollWorkletHandlers,
  TScrollDirection,
} from "./scroll.types";

/**
 * Создаёт телеметрию скролла: один scroll-хендлер, который ведёт shared values
 * (offset, направление, drag/momentum, overscroll). Подключение:
 * onScroll={telemetry.scrollHandler} + scrollEventThrottle={16}.
 *
 * external — чейнинг сторонних worklet-обработчиков (если сторонней логике
 * нужны сами события, а не shared values).
 */
export const useScrollTelemetry = (
  external?: IScrollWorkletHandlers,
): IScrollTelemetry => {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isMomentum = useSharedValue(false);
  const direction = useSharedValue<TScrollDirection>(null);
  const overscrollTop = useSharedValue(0);
  const overscrollBottom = useSharedValue(0);

  const handlers = useMemo<IScrollWorkletHandlers>(
    () => ({
      onScroll: (event: NativeScrollEvent) => {
        "worklet";
        const { x, y } = event.contentOffset;
        const prevX = offsetX.value;
        const prevY = offsetY.value;

        if (y !== prevY) {
          direction.value = y > prevY ? "down" : "up";
        } else if (x !== prevX) {
          direction.value = x > prevX ? "right" : "left";
        }

        offsetX.value = x;
        offsetY.value = y;

        const maxY = Math.max(
          0,
          event.contentSize.height - event.layoutMeasurement.height,
        );

        overscrollTop.value = Math.max(0, -y);
        overscrollBottom.value = Math.max(0, y - maxY);

        external?.onScroll?.(event);
      },
      onBeginDrag: (event: NativeScrollEvent) => {
        "worklet";
        isDragging.value = true;
        external?.onBeginDrag?.(event);
      },
      onEndDrag: (event: NativeScrollEvent) => {
        "worklet";
        isDragging.value = false;
        external?.onEndDrag?.(event);
      },
      onMomentumBegin: (event: NativeScrollEvent) => {
        "worklet";
        isMomentum.value = true;
        external?.onMomentumBegin?.(event);
      },
      onMomentumEnd: (event: NativeScrollEvent) => {
        "worklet";
        isMomentum.value = false;
        external?.onMomentumEnd?.(event);
      },
    }),
    // shared values стабильны
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [external],
  );

  const scrollHandler = useAnimatedScrollHandler(handlers, [handlers]);

  return useMemo(
    () => ({
      offsetX,
      offsetY,
      isDragging,
      isMomentum,
      direction,
      overscrollTop,
      overscrollBottom,
      scrollHandler,
      handlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handlers, scrollHandler],
  );
};
