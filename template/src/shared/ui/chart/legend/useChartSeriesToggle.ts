import { useCallback, useMemo, useState } from "react";

import type { IChartSeries } from "../core";
import { normalizeHiddenKeys, toggleHiddenKey } from "./series-visibility";

export interface IChartSeriesToggle<S extends IChartSeries> {
  /** Видимые серии — их и отдавать в `<Chart series>`. */
  visibleSeries: S[];
  hiddenKeys: ReadonlySet<string>;
  toggle: (key: string) => void;
  /** Пропсы для `<ChartLegend {...legendProps} />`. */
  legendProps: {
    series: S[];
    hiddenKeys: ReadonlySet<string>;
    onToggle: (key: string) => void;
  };
}

/**
 * Состояние включения серий для легенды. Скрытая серия не попадает в
 * `visibleSeries` — значит, не рисуется, не участвует в тултипе и в
 * авто-домене осей. Ключи исчезнувших серий отбрасываются.
 */
export const useChartSeriesToggle = <S extends IChartSeries>(
  series: S[],
  initialHidden?: readonly string[],
): IChartSeriesToggle<S> => {
  const [hiddenState, setHiddenState] = useState<ReadonlySet<string>>(
    () => new Set(initialHidden),
  );
  const keys = useMemo(() => series.map(item => item.id), [series]);
  const hiddenKeys = useMemo(
    () => normalizeHiddenKeys(hiddenState, keys),
    [hiddenState, keys],
  );

  const toggle = useCallback(
    (key: string) =>
      setHiddenState(previous =>
        toggleHiddenKey(normalizeHiddenKeys(previous, keys), keys, key),
      ),
    [keys],
  );

  const visibleSeries = useMemo(
    () =>
      hiddenKeys.size === 0
        ? series
        : series.filter(item => !hiddenKeys.has(item.id)),
    [series, hiddenKeys],
  );

  const legendProps = useMemo(
    () => ({ series, hiddenKeys, onToggle: toggle }),
    [series, hiddenKeys, toggle],
  );

  return { visibleSeries, hiddenKeys, toggle, legendProps };
};
