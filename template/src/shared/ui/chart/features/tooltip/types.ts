import type { ChartDatum, IChartSeries } from "../../core/types";

export interface ActiveTooltipPoint {
  series: IChartSeries;
  datum: ChartDatum;
  color: string;
}
