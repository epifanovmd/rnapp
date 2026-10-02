import { useCallback, useMemo, useRef } from "react";
import {
  cancelAnimation,
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import {
  clampRange,
  isRangeValid,
  lastRange,
  pinnedRange,
  reconcileRange,
  resolveViewPin,
  ViewLimits,
  ViewPin,
  ViewRange,
  zoomRange,
} from "./viewport-math";

export interface ChartViewportOptions {
  /** Ширина окна при первых данных (домен X); не задана — все данные. */
  initialSpan?: number;
  /** Минимальная ширина окна (домен X); по умолчанию — 5 средних интервалов между точками. */
  minSpan?: number;
  /** Длительность анимации программной смены окна, мс. */
  animationDuration?: number;
  /** Окно сменилось по жесту или программно — после окончания жеста/анимации. */
  onChange?: (range: ViewRange) => void;
}

/**
 * Окно просмотра графика по X: состояние на UI-потоке и команды. Создаётся
 * вне `<Chart>` и передаётся в `viewport` — им же управляют `ChartRangePresets`
 * и `ChartNavigator`; один контроллер на несколько графиков синхронизирует их.
 */
export interface ChartViewport {
  /** Видимое окно (домен X); NaN — до первых данных. */
  start: SharedValue<number>;
  end: SharedValue<number>;
  /** Экстент данных (ставит график). */
  boundsMin: SharedValue<number>;
  boundsMax: SharedValue<number>;
  /** Минимальная ширина окна. */
  minSpan: SharedValue<number>;
  /** Цель идущей анимации окна (NaN — анимации нет). */
  targetStart: SharedValue<number>;
  targetEnd: SharedValue<number>;
  /** Идёт жест: окно не едет за новыми данными, пока он не закончится. */
  interacting: SharedValue<boolean>;
  /** Ширина окна при первых данных (`<= 0` — все данные). */
  initialSpan: number;
  /** Окно `[start, end]` (домен X). */
  setRange: (range: ViewRange, animated?: boolean) => void;
  /** Последний отрезок данных ширины `span` — окно следит за новыми данными. */
  showLast: (span: number, animated?: boolean) => void;
  /** Все данные. */
  showAll: (animated?: boolean) => void;
  /** Зум вокруг центра окна: `factor > 1` — приблизить. */
  zoomBy: (factor: number, animated?: boolean) => void;
  /** Окно как при первых данных. */
  reset: (animated?: boolean) => void;
  /** Worklet-команды для жестов и графика. */
  worklets: ChartViewportWorklets;
}

export interface ChartViewportWorklets {
  limits: () => ViewLimits;
  /** Текущее окно; до первых данных — окно по `initialSpan`. */
  range: () => ViewRange;
  /** Мгновенно, без анимации и оповещения. */
  setNow: (range: ViewRange) => void;
  /** Анимация к окну (с ограничением по данным) и оповещение по завершении. */
  animateTo: (range: ViewRange) => void;
  /** Новый экстент данных: окно поджимается или едет за данными. */
  applyBounds: (min: number, max: number, autoMinSpan: number) => void;
  /** Конец жеста: окно, «прижатое» к концу во время жеста, догоняет данные. */
  settle: () => void;
  /** Оповещение `onChange`. */
  notify: () => void;
  /** Остановить анимации окна (начало жеста). */
  stop: () => void;
}

/** Контроллер окна просмотра графика. */
export const useChartViewport = (
  options: ChartViewportOptions = {},
): ChartViewport => {
  const { initialSpan = 0, minSpan, animationDuration = 300 } = options;
  const onChangeRef = useRef(options.onChange);

  onChangeRef.current = options.onChange;

  const start = useSharedValue(NaN);
  const end = useSharedValue(NaN);
  const boundsMin = useSharedValue(NaN);
  const boundsMax = useSharedValue(NaN);
  const minSpanValue = useSharedValue(minSpan ?? 0);
  const interacting = useSharedValue(false);
  /** К чему было прижато окно, когда жест «заморозил» слежение. */
  const pinned = useSharedValue<ViewPin>("none");
  /** Цель текущей анимации (NaN — анимации нет). */
  const targetStart = useSharedValue(NaN);
  const targetEnd = useSharedValue(NaN);

  const emitChange = useCallback((from: number, to: number) => {
    onChangeRef.current?.({ start: from, end: to });
  }, []);

  return useMemo<ChartViewport>(() => {
    const limits = (): ViewLimits => {
      "worklet";

      return {
        min: boundsMin.value,
        max: boundsMax.value,
        minSpan: minSpanValue.value,
      };
    };

    const range = (): ViewRange => {
      "worklet";

      const current = { start: start.value, end: end.value };

      if (isRangeValid(current)) {
        return current;
      }

      return lastRange(initialSpan, limits());
    };

    const notify = () => {
      "worklet";

      scheduleOnRN(emitChange, start.value, end.value);
    };

    const stop = () => {
      "worklet";

      cancelAnimation(start);
      cancelAnimation(end);
      targetStart.value = NaN;
      targetEnd.value = NaN;
    };

    const setNow = (next: ViewRange) => {
      "worklet";

      stop();
      start.value = next.start;
      end.value = next.end;
    };

    const animateTo = (next: ViewRange) => {
      "worklet";

      const bounds = limits();
      const clamped = bounds.max > bounds.min ? clampRange(next, bounds) : next;

      targetStart.value = clamped.start;
      targetEnd.value = clamped.end;
      start.value = withTiming(clamped.start, {
        duration: animationDuration,
      });
      end.value = withTiming(
        clamped.end,
        { duration: animationDuration },
        finished => {
          if (finished) {
            targetStart.value = NaN;
            targetEnd.value = NaN;
            notify();
          }
        },
      );
    };

    const applyBounds = (min: number, max: number, autoMinSpan: number) => {
      "worklet";

      const previous = limits();

      minSpanValue.value = minSpan ?? autoMinSpan;
      boundsMin.value = min;
      boundsMax.value = max;

      const next = limits();
      const animating = Number.isFinite(targetStart.value);
      const current = animating
        ? { start: targetStart.value, end: targetEnd.value }
        : { start: start.value, end: end.value };

      if (interacting.value) {
        // Под пальцем окно не едет — только запоминается, к чему было прижато.
        if (pinned.value === "none") {
          pinned.value = resolveViewPin(current, previous);
        }
        if (next.max > next.min && isRangeValid(current)) {
          const clamped = clampRange(current, next);

          if (clamped.start !== current.start || clamped.end !== current.end) {
            setNow(clamped);
          }
        }

        return;
      }

      const reconciled = reconcileRange({
        range: current,
        previous,
        next,
        initialSpan,
      });

      if (animating) {
        animateTo(reconciled);
      } else {
        setNow(reconciled);
      }
    };

    const settle = () => {
      "worklet";

      const target = pinnedRange(pinned.value, range(), limits());

      pinned.value = "none";

      if (target) {
        animateTo(target);
      }
    };

    const apply = (next: ViewRange, animated: boolean) => {
      "worklet";

      if (animated) {
        animateTo(next);
      } else {
        const bounds = limits();

        setNow(bounds.max > bounds.min ? clampRange(next, bounds) : next);
        notify();
      }
    };

    const setRangeWorklet = (next: ViewRange, animated: boolean) => {
      "worklet";

      apply(next, animated);
    };

    const showLastWorklet = (span: number, animated: boolean) => {
      "worklet";

      apply(lastRange(span, limits()), animated);
    };

    const zoomByWorklet = (factor: number, animated: boolean) => {
      "worklet";

      const current = range();

      apply(
        zoomRange(current, (current.start + current.end) / 2, factor),
        animated,
      );
    };

    return {
      start,
      end,
      boundsMin,
      boundsMax,
      minSpan: minSpanValue,
      targetStart,
      targetEnd,
      interacting,
      initialSpan,
      setRange: (next, animated = true) =>
        scheduleOnUI(setRangeWorklet, next, animated),
      showLast: (span, animated = true) =>
        scheduleOnUI(showLastWorklet, span, animated),
      showAll: (animated = true) => scheduleOnUI(showLastWorklet, 0, animated),
      zoomBy: (factor, animated = true) =>
        scheduleOnUI(zoomByWorklet, factor, animated),
      reset: (animated = true) =>
        scheduleOnUI(showLastWorklet, initialSpan, animated),
      worklets: {
        limits,
        range,
        setNow,
        animateTo,
        applyBounds,
        settle,
        notify,
        stop,
      },
    };
  }, [
    start,
    end,
    boundsMin,
    boundsMax,
    minSpanValue,
    interacting,
    pinned,
    targetStart,
    targetEnd,
    initialSpan,
    minSpan,
    animationDuration,
    emitChange,
  ]);
};
