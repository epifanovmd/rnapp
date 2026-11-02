import React, { useCallback, useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Chip } from "../../chip";
import { FlexProps, Row } from "../../flex-view";
import { ChartViewport, matchSpanPreset, SpanPreset } from "../core";

export interface ChartRangePreset<
  K extends string = string,
> extends SpanPreset<K> {
  label: string;
}

export interface ChartRangePresetsProps<
  K extends string = string,
> extends FlexProps {
  viewport: ChartViewport;
  presets: readonly ChartRangePreset<K>[];
  /** Анимировать переход к пресету. По умолчанию `true`. */
  animated?: boolean;
  /** Допуск совпадения ширины окна с пресетом, доли. По умолчанию 0.02. */
  tolerance?: number;
  /** Активный пресет сменился (`null` — окно задано жестом). */
  onPresetChange?: (key: K | null) => void;
}

/**
 * Пресеты таймфрейма: нажатие показывает последний отрезок данных заданной
 * ширины (окно следит за live-данными) или все данные. Активный пресет
 * определяется по ширине окна — после свободного зума не подсвечен ни один.
 */
export const ChartRangePresets = <K extends string = string>({
  viewport,
  presets,
  animated = true,
  tolerance = 0.02,
  onPresetChange,
  ...rest
}: ChartRangePresetsProps<K>) => {
  const [active, setActive] = useState<K | null>(null);
  const { start, end, targetStart, targetEnd, boundsMin, boundsMax } = viewport;

  const handleMatch = useCallback(
    (key: K | null) => {
      setActive(key);
      onPresetChange?.(key);
    },
    [onPresetChange],
  );

  // Во время анимации — по её цели: промежуточные ширины не гасят подсветку.
  useAnimatedReaction(
    () => {
      const animating = Number.isFinite(targetStart.value);
      const from = animating ? targetStart.value : start.value;
      const to = animating ? targetEnd.value : end.value;
      const full = boundsMax.value - boundsMin.value;

      if (!Number.isFinite(from) || !Number.isFinite(to) || !(full > 0)) {
        return null;
      }

      return matchSpanPreset(to - from, full, presets, tolerance);
    },
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(handleMatch, next);
      }
    },
    [presets, tolerance, handleMatch],
  );

  const select = useCallback(
    (preset: ChartRangePreset<K>) => {
      if (preset.span === "all") {
        viewport.showAll(animated);
      } else {
        viewport.showLast(preset.span, animated);
      }
    },
    [viewport, animated],
  );

  return (
    <Row gap={8} wrap={"wrap"} {...rest}>
      {presets.map(preset => (
        <Chip
          key={preset.key}
          text={preset.label}
          isActive={active === preset.key}
          onPress={() => select(preset)}
        />
      ))}
    </Row>
  );
};
