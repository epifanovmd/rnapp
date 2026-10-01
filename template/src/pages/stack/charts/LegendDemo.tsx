import { useTheme } from "@shared/lib/theme";
import { Col, Text } from "@shared/ui";
import {
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartLegend,
  CrosshairLayer,
  GridLayer,
  LineLayer,
  TooltipLayer,
  useChartSeriesToggle,
} from "@shared/ui/chart";
import React, { FC, memo } from "react";

import { TRAFFIC_SERIES } from "./chart-mock-data";

const formatDay = (value: number) => {
  const date = new Date(value);

  return `${date.getDate()}.${date.getMonth() + 1}`;
};

/** Легенда с переключением серий: скрытая серия уходит из графика, тултипа и домена Y. */
export const LegendDemo: FC = memo(() => {
  const { colors } = useTheme();
  const { visibleSeries, legendProps } = useChartSeriesToggle(TRAFFIC_SERIES);

  return (
    <Col gap={12}>
      <ChartLegend {...legendProps} />
      <Chart
        series={visibleSeries}
        height={220}
        yPaddingRatio={0.15}
        padding={{ left: 48, bottom: 32, top: 24 }}
      >
        <GridLayer color={colors.slate200} />
        <LineLayer curve={"smooth"} strokeWidth={2} />
        <AxisLayerY
          tickCount={4}
          color={colors.slate400}
          labelColor={colors.textTertiary}
        />
        <AxisLayerX
          tickCount={5}
          color={colors.slate400}
          labelColor={colors.textTertiary}
          formatLabel={formatDay}
        />
        <CrosshairLayer color={colors.slate400} />
        <TooltipLayer />
      </Chart>
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {"Статичная легенда из списка {color, label}:"}
      </Text>
      <ChartLegend
        items={[
          { key: "p50", label: "p50", color: colors.green500 },
          { key: "p95", label: "p95", color: colors.orange500 },
          { key: "p99", label: "p99", color: colors.red500 },
        ]}
      />
    </Col>
  );
});
