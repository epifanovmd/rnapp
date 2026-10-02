import { createContext, useContext } from "react";
import type { DerivedValue } from "react-native-reanimated";

import type { LinearScale } from "../scale/linear-scale";
import type { ChartDimensions, ChartPlotRect } from "../types";
import type { ChartViewport } from "../viewport/useChartViewport";

/** Размеры канваса, область построения и шкалы X/Y (на UI-потоке). */
export interface ChartGeometryContextValue {
  dimensions: ChartDimensions;
  plot: ChartPlotRect;
  /** Шкала X видимого окна. */
  xScale: DerivedValue<LinearScale>;
  /** Шкала Y (домен анимируется к `yDomainTarget`). */
  yScale: DerivedValue<LinearScale>;
  /** Целевой домен Y — без анимации; `null` — данных нет. */
  yDomainTarget: DerivedValue<[number, number] | null>;
  viewport: ChartViewport;
}

export const ChartGeometryContext =
  createContext<ChartGeometryContextValue | null>(null);

/** Хук доступа к геометрии графика. */
export const useChartGeometry = (): ChartGeometryContextValue => {
  const context = useContext(ChartGeometryContext);

  if (!context) {
    throw new Error("useChartGeometry must be used inside <Chart>.");
  }

  return context;
};
