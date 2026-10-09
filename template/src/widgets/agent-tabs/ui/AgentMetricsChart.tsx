import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";
import { useTheme } from "@shared/lib/theme";
import {
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartLegend,
  Col,
  CrosshairLayer,
  GridLayer,
  type IChartSeries,
  LineLayer,
  Spinner,
  Text,
  TooltipLayer,
  useChartSeriesToggle,
  withOpacity,
} from "@shared/ui";
import React, { FC, useMemo } from "react";

import { metricSeriesData, type TMetricPick } from "../model/metric-series";

/** Ряд графика показателей узла. */
export interface IAgentMetricSeries {
  id: string;
  label: string;
  color: string;
  pick: TMetricPick;
}

interface IAgentMetricsChartProps {
  points: IAgentMetricsPointDto[];
  series: IAgentMetricSeries[];
  formatValue: (value: number) => string;
  loading?: boolean;
  height?: number;
}

const CHART_HEIGHT = 180;

/** Линейный график показателей узла по точкам метрик; зум и прокрутка по времени. */
export const AgentMetricsChart: FC<IAgentMetricsChartProps> = ({
  points,
  series: definitions,
  formatValue,
  loading,
  height = CHART_HEIGHT,
}) => {
  const { colors } = useTheme();
  const series = useMemo<IChartSeries[]>(
    () =>
      definitions.map(def => ({
        id: def.id,
        label: def.label,
        color: def.color,
        data: metricSeriesData(points, def.pick),
      })),
    [points, definitions],
  );
  const { visibleSeries, legendProps } = useChartSeriesToggle(series);

  if (series.every(item => item.data.length < 2)) {
    return (
      <Col height={height} centerContent>
        {loading ? (
          <Spinner size={24} />
        ) : (
          <Text textStyle={"Caption_M3"} color={"textSecondary"}>
            {"Метрик пока нет"}
          </Text>
        )}
      </Col>
    );
  }

  return (
    <Col gap={8}>
      <ChartLegend {...legendProps} />
      <Chart
        series={visibleSeries}
        height={height}
        beginAtZero
        yPaddingRatio={0.1}
        yNice={4}
        zoom
        padding={{ top: 8, left: 4, right: 8, bottom: 28 }}
      >
        <GridLayer color={colors.border} xTicks={"time"} yTickCount={4} />
        <AxisLayerX
          tickCount={3}
          color={colors.border}
          labelColor={colors.textTertiary}
          ticks={"time"}
        />
        <LineLayer curve={"smooth"} strokeWidth={2} />
        <AxisLayerY
          tickCount={4}
          ticks={"nice"}
          labelSide={"in"}
          showAxisLine={false}
          showTicks={false}
          color={colors.border}
          labelColor={colors.textTertiary}
          labelBackground={withOpacity(colors.surface, 0.8)}
          formatLabel={formatValue}
        />
        <CrosshairLayer color={colors.textTertiary} />
        <TooltipLayer
          formatRow={point =>
            `${point.series.label}: ${formatValue(point.datum.y)}`
          }
        />
      </Chart>
    </Col>
  );
};
