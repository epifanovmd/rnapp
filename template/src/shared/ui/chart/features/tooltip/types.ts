import type { ChartDatum, IChartSeries } from "../../core/types";

export interface ActiveTooltipPoint {
  /** Серия, которой принадлежит точка. */
  series: IChartSeries;
  /** Активная точка данных этой серии. */
  datum: ChartDatum;
  /** Разрешённый цвет точки (собственный `series.color` либо цвет из `colors` по кругу). */
  color: string;
}
