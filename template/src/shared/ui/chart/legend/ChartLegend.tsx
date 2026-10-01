import React, { FC, memo, useMemo } from "react";

import { FlexProps, Row } from "../../flex-view";
import type { IChartSeries } from "../core";
import { ChartLegendItem } from "./ChartLegendItem";
import { canToggleKey } from "./series-visibility";

/** Пункт легенды без привязки к серии. */
export interface IChartLegendEntry {
  key: string;
  label: string;
  color: string;
}

type TChartLegendSource =
  | {
      /** Пункты из серий графика: ключ — `id`, подпись — `label ?? id`. */
      series: readonly IChartSeries[];
      items?: never;
    }
  | {
      items: readonly IChartLegendEntry[];
      series?: never;
    };

export type TChartLegendProps = TChartLegendSource &
  FlexProps & {
    /** Скрытые ключи (контролируемо). */
    hiddenKeys?: ReadonlySet<string> | readonly string[];
    /** Нажатие по пункту; без него легенда только отображает. */
    onToggle?: (key: string) => void;
  };

const toEntries = (
  series: readonly IChartSeries[] | undefined,
  items: readonly IChartLegendEntry[] | undefined,
): readonly IChartLegendEntry[] =>
  items ??
  (series ?? []).map(({ id, label, color }) => ({
    key: id,
    label: label ?? id,
    color,
  }));

/**
 * Легенда графика: цвет-точка и подпись на пункт, перенос по строкам. С
 * `onToggle` пункты переключают серии; последнюю видимую выключить нельзя.
 * Состояние — `useChartSeriesToggle` или своё (`hiddenKeys`).
 */
export const ChartLegend: FC<TChartLegendProps> = memo(
  ({ series, items, hiddenKeys, onToggle, ...rest }) => {
    const entries = useMemo(() => toEntries(series, items), [series, items]);
    const hidden = useMemo(
      () => (hiddenKeys instanceof Set ? hiddenKeys : new Set(hiddenKeys)),
      [hiddenKeys],
    );
    const keys = useMemo(() => entries.map(entry => entry.key), [entries]);

    return (
      <Row wrap alignItems={"center"} gap={12} {...rest}>
        {entries.map(entry => (
          <ChartLegendItem
            key={entry.key}
            color={entry.color}
            label={entry.label}
            hidden={hidden.has(entry.key)}
            disabled={!canToggleKey(hidden, keys, entry.key)}
            onPress={onToggle ? () => onToggle(entry.key) : undefined}
          />
        ))}
      </Row>
    );
  },
);
