import { useTheme } from "@shared/lib/theme";
import { Col } from "@shared/ui";
import { AreaLayer, Chart, GridLayer, LineLayer } from "@shared/ui/chart";
import React, { FC, memo, useMemo } from "react";

import { createHeavySeries } from "./heavy-series";

export const HEAVY_CHART_HEIGHT = 160;
export const HEAVY_CHART_COUNT = 4;

/** Тяжёлый контент: несколько Skia-графиков, монтируются разом. */
export const HeavyCharts: FC = memo(() => {
  const { colors } = useTheme();
  const charts = useMemo(
    () =>
      Array.from({ length: HEAVY_CHART_COUNT }, (_, index) =>
        createHeavySeries(
          `series-${index}`,
          [colors.blue500, colors.green500, colors.orange500, colors.red500][
            index % 4
          ],
          index,
        ),
      ),
    [colors],
  );

  return (
    <Col gap={12}>
      {charts.map(series => (
        <Col key={series[0].id} bg={"surface"} radius={16} pv={8}>
          <Chart series={series} height={HEAVY_CHART_HEIGHT}>
            <GridLayer color={colors.border} />
            <AreaLayer curve={"smooth"} opacity={0.15} />
            <LineLayer curve={"smooth"} strokeWidth={2} />
          </Chart>
        </Col>
      ))}
    </Col>
  );
});
