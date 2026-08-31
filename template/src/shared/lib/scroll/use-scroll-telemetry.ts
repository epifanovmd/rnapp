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
import {
  resolveDirection,
  resolveMaxOffset,
  resolveOverscrollBottom,
  resolveOverscrollTop,
} from "./scroll-metrics";

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
  const maxOffsetY = useSharedValue(0);

  const handlers = useMemo<IScrollWorkletHandlers>(
    () => ({
      onScroll: (event: NativeScrollEvent) => {
        "worklet";
        const { x, y } = event.contentOffset;
        const maxY = resolveMaxOffset(
          event.contentSize.height,
          event.layoutMeasurement.height,
        );

        direction.value = resolveDirection(
          x,
          y,
          offsetX.value,
          offsetY.value,
          direction.value,
        );

        offsetX.value = x;
        offsetY.value = y;
        maxOffsetY.value = maxY;
        overscrollTop.value = resolveOverscrollTop(y);
        overscrollBottom.value = resolveOverscrollBottom(y, maxY);

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
      maxOffsetY,
      scrollHandler,
      handlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handlers, scrollHandler],
  );
};
