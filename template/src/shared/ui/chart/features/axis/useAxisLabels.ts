import { useCallback, useEffect, useRef } from "react";
import {
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { SkFont, TickSet, TimeTickUnit } from "../../core";

/** Подписи делений: значения, тексты и их ширины — выровнены по индексу. */
export interface AxisLabels {
  values: number[];
  texts: string[];
  widths: number[];
}

export type AxisLabelFormatter = (value: number, unit?: TimeTickUnit) => string;

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
    (values: number[], unit: TimeTickUnit | null) => {
      const texts = values.map(value =>
        formatRef.current(value, unit ?? undefined),
      );

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
        scheduleOnRN(update, next.values, next.unit);
      }
    },
    [ticks, update],
  );

  // Новый форматтер или шрифт — перевести уже показанные деления.
  useEffect(() => {
    const current = labels.value;

    if (current.values.length > 0) {
      update(current.values, ticks.value.unit);
    }
  }, [format, update, labels, ticks]);

  return labels;
};
