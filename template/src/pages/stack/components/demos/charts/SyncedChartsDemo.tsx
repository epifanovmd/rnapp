import { useTheme } from "@shared/lib/theme";
import { Col } from "@shared/ui";
import {
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartRangePresets,
  CrosshairLayer,
  GridLayer,
  LineLayer,
  TooltipLayer,
  useChartViewport,
} from "@shared/ui/chart";
import React, { FC, memo } from "react";

import { TIMEFRAME_PRESETS } from "./chart-demo-format";
import { REVENUE_VS_EXPENSES } from "./chart-mock-data";

const DAY = 86_400_000;
const [REVENUE, EXPENSES] = REVENUE_VS_EXPENSES;
const REVENUE_SERIES = [REVENUE];
const EXPENSES_SERIES = [EXPENSES];

/** Два графика на одном окне: зум и прокрутка любого двигают оба. */
export const SyncedChartsDemo: FC = memo(() => {
  const { colors } = useTheme();
  const viewport = useChartViewport({ initialSpan: 7 * DAY });

  return (
    <Col gap={12}>
      <ChartRangePresets viewport={viewport} presets={TIMEFRAME_PRESETS} />
      {[REVENUE_SERIES, EXPENSES_SERIES].map(series => (
        <Chart
          key={series[0].id}
          series={series}
          viewport={viewport}
          zoom
          height={150}
          yPaddingRatio={0.1}
          padding={{ left: 48, bottom: 28, top: 12 }}
        >
          <GridLayer color={colors.slate200} xTicks={"time"} />
          <LineLayer curve={"smooth"} strokeWidth={2} />
          <AxisLayerY
            tickCount={3}
            color={colors.slate400}
            labelColor={colors.textTertiary}
          />
          <AxisLayerX
            tickCount={4}
            ticks={"time"}
            color={colors.slate400}
            labelColor={colors.textTertiary}
          />
          <CrosshairLayer color={colors.slate400} />
          <TooltipLayer />
        </Chart>
      ))}
    </Col>
  );
});
