import { createContext, useContext } from "react";

import type { ChartDimensions, IScale } from "../types";

/** Размеры канваса и шкалы X/Y. */
export interface ChartGeometryContextValue {
  dimensions: ChartDimensions;
  xScale: IScale;
  yScale: IScale;
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
