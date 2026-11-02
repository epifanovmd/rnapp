import {
  usePanGesture,
  usePinchGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import {
  SharedValue,
  useSharedValue,
  withDecay,
} from "react-native-reanimated";

import type { ChartPlotRect, ChartZoomOptions } from "../types";
import type { ChartViewport } from "../viewport/useChartViewport";
import {
  anchoredRange,
  clampRange,
  clampSpan,
  lastRange,
  rubberRange,
  zoomRange,
} from "../viewport/viewport-math";

export interface ViewportGesturesOptions {
  enabled: boolean;
  zoom: Required<ChartZoomOptions>;
  plot: ChartPlotRect;
  xReverse: boolean;
  activeOffsetX?: number | [number, number];
  failOffsetY?: number | [number, number];
}

export interface ViewportGestures {
  pan: ReturnType<typeof usePanGesture>;
  pinch: ReturnType<typeof usePinchGesture>;
  doubleTap: ReturnType<typeof useTapGesture>;
  /** Идёт прокрутка или зум (вкл. инерцию). */
  panActive: SharedValue<boolean>;
  pinchActive: SharedValue<boolean>;
}

/**
 * Жесты окна: прокрутка одним пальцем (с сопротивлением за краями и
 * инерцией), зум двумя пальцами вокруг точки между ними, двойной тап.
 * Пишут прямо в shared values окна — без React-рендера.
 */
export const useViewportGestures = (
  viewport: ChartViewport,
  {
    enabled,
    zoom,
    plot,
    xReverse,
    activeOffsetX,
    failOffsetY,
  }: ViewportGesturesOptions,
): ViewportGestures => {
  const { start, end, initialSpan, worklets } = viewport;
  const { limits, range, setNow, animateTo, notify, stop } = worklets;
  const panActive = useSharedValue(false);
  const pinchActive = useSharedValue(false);
  /** Окно без сопротивления: копится сдвиг пальца, на экран — с rubber. */
  const rawStart = useSharedValue(0);
  /** В этом жесте прокрутки был pinch — без инерции на отпускании. */
  const pinchedDuringPan = useSharedValue(false);
  /** Pinch закончился, палец остался — прокрутка продолжится от текущего окна. */
  const reanchorPan = useSharedValue(false);
  const anchorDomain = useSharedValue(0);
  const anchorSpan = useSharedValue(0);
  const anchorScale = useSharedValue(1);
  const pinchPointers = useSharedValue(0);
  const plotLeft = plot.left;
  const plotWidth = Math.max(plot.width, 1);
  const direction = xReverse ? -1 : 1;

  /** Доля ширины области построения под пикселем X (с учётом разворота оси). */
  const ratioAt = (x: number) => {
    "worklet";

    const ratio = (x - plotLeft) / plotWidth;

    return xReverse ? 1 - ratio : ratio;
  };

  /** Окно за краем данных — пружиной обратно; иначе — оповещение. */
  const settleInside = () => {
    "worklet";

    const current = range();
    const clamped = clampRange(current, limits());

    if (clamped.start !== current.start || clamped.end !== current.end) {
      animateTo(clamped);
    } else {
      notify();
    }
  };

  const pan = usePanGesture({
    enabled: enabled && zoom.pan,
    maxPointers: 1,
    activeOffsetX,
    failOffsetY,
    onActivate: () => {
      stop();
      panActive.value = true;
      pinchedDuringPan.value = false;
      reanchorPan.value = false;
      rawStart.value = range().start;
    },
    onUpdate: event => {
      if (pinchActive.value) {
        return;
      }

      const current = range();

      // После pinch палец продолжает прокрутку от текущего окна, без скачка.
      if (reanchorPan.value) {
        reanchorPan.value = false;
        rawStart.value = current.start;
      }

      const span = current.end - current.start;

      rawStart.value -= ((event.changeX * direction) / plotWidth) * span;
      setNow(
        rubberRange(
          { start: rawStart.value, end: rawStart.value + span },
          limits(),
        ),
      );
    },
    onDeactivate: event => {
      if (pinchActive.value || pinchedDuringPan.value) {
        pinchedDuringPan.value = false;
        panActive.value = false;
        if (!pinchActive.value) settleInside();

        return;
      }

      const bounds = limits();
      const current = range();
      const span = current.end - current.start;
      const clamped = clampRange(current, bounds);
      const outside =
        clamped.start !== current.start || clamped.end !== current.end;

      if (outside || !zoom.inertia) {
        panActive.value = false;
        settleInside();

        return;
      }

      const velocity = -((event.velocityX * direction) / plotWidth) * span;

      start.value = withDecay({
        velocity,
        clamp: [bounds.min, bounds.max - span],
      });
      end.value = withDecay(
        { velocity, clamp: [bounds.min + span, bounds.max] },
        () => {
          panActive.value = false;
          notify();
        },
      );
    },
  });

  const pinch = usePinchGesture({
    enabled: enabled && zoom.pinch,
    onActivate: event => {
      stop();
      pinchActive.value = true;
      if (panActive.value) pinchedDuringPan.value = true;

      const current = range();
      const span = current.end - current.start;

      anchorSpan.value = span;
      anchorScale.value = event.scale;
      anchorDomain.value = current.start + ratioAt(event.focalX) * span;
      pinchPointers.value = event.numberOfPointers;
    },
    onUpdate: event => {
      // При отпускании одного пальца фокус прыгает на оставшийся — такие
      // события пропускаются; возврат второго пальца — новая точка привязки.
      if (event.numberOfPointers !== 2) {
        pinchPointers.value = event.numberOfPointers;

        return;
      }

      if (pinchPointers.value !== 2) {
        const current = range();
        const span = current.end - current.start;

        anchorSpan.value = span;
        anchorScale.value = event.scale;
        anchorDomain.value = current.start + ratioAt(event.focalX) * span;
        pinchPointers.value = 2;
      }

      const bounds = limits();
      const span = clampSpan(
        anchorSpan.value / (event.scale / anchorScale.value),
        bounds,
      );

      setNow(
        rubberRange(
          anchoredRange(anchorDomain.value, ratioAt(event.focalX), span),
          bounds,
        ),
      );
    },
    onDeactivate: () => {
      settleInside();
    },
    onFinalize: () => {
      pinchActive.value = false;
      if (panActive.value) reanchorPan.value = true;
    },
  });

  const doubleTap = useTapGesture({
    enabled: enabled && zoom.doubleTap,
    numberOfTaps: 2,
    maxDuration: 250,
    onActivate: event => {
      const bounds = limits();
      const current = range();
      const span = current.end - current.start;

      if (span <= Math.min(bounds.minSpan, bounds.max - bounds.min) * 1.01) {
        animateTo(lastRange(initialSpan, bounds));

        return;
      }

      const anchor = current.start + ratioAt(event.x) * span;

      animateTo(zoomRange(current, anchor, zoom.doubleTapFactor));
    },
  });

  return { pan, pinch, doubleTap, panActive, pinchActive };
};
