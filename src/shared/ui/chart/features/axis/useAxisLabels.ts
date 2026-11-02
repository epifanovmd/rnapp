import { useCallback, useEffect, useRef } from "react";
import {
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { AxisTickInfo, SkFont, TickSet } from "../../core";

/** Подписи делений: значения, тексты и их ширины — выровнены по индексу. */
export interface AxisLabels {
  values: number[];
  texts: string[];
  widths: number[];
}

/** Подпись деления; `tick` — единица и шаг (для одинакового вида всех подписей оси). */
export type AxisLabelFormatter = (value: number, tick: AxisTickInfo) => string;

const EMPTY_LABELS: AxisLabels = { values: [], texts: [], widths: [] };

/**
 * Тексты подписей для делений с UI-потока. Форматтер — обычная JS-функция:
 * вызывается только при смене набора делений (`TickSet.key`), а не на каждый
 * кадр прокрутки; деления строятся с запасом за краями окна, поэтому подпись
 * готова до того, как деление въедет в окно.
 */
export const useAxisLabels = (
  ticks: DerivedValue<TickSet>,
  format: AxisLabelFormatter,
  font: SkFont | null,
): SharedValue<AxisLabels> => {
  const labels = useSharedValue<AxisLabels>(EMPTY_LABELS);
  const formatRef = useRef(format);

  formatRef.current = format;

  const update = useCallback(
    (values: number[], tick: AxisTickInfo) => {
      const texts = values.map(value => formatRef.current(value, tick));

      labels.value = {
        values,
        texts,
        widths: texts.map(text => (font ? font.measureText(text).width : 0)),
      };
    },
    [font, labels],
  );

  useAnimatedReaction(
    () => ticks.value,
    (next, previous) => {
      if (next.key !== previous?.key) {
        scheduleOnRN(update, next.values, {
          unit: next.unit,
          magnitude: next.magnitude,
          step: next.step,
        });
      }
    },
    [ticks, update],
  );

  // Новый форматтер или шрифт — перевести уже показанные деления.
  useEffect(() => {
    const current = labels.value;

    if (current.values.length > 0) {
      const { unit, magnitude, step } = ticks.value;

      update(current.values, { unit, magnitude, step });
    }
  }, [format, update, labels, ticks]);

  return labels;
};
