import { useTheme } from "@shared/lib/theme";
import {
  AreaLayer,
  AxisLayerX,
  AxisLayerY,
  Chart,
  CrosshairLayer,
  CurrentValueLineLayer,
  GridLayer,
  IChartSeries,
  LineLayer,
  TooltipLayer,
} from "@shared/ui/chart";
import React, { FC, memo, useEffect, useMemo, useState } from "react";

import {
  createInitialLivePriceData,
  nextLivePriceData,
} from "./chart-mock-data";

/** Live-тикер: свой таймер и состояние — тики не перерисовывают соседние примеры. */
export const LivePriceDemo: FC = memo(() => {
  const { colors } = useTheme();
  const [livePriceData, setLivePriceData] = useState(
    createInitialLivePriceData,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePriceData(previous => nextLivePriceData(previous));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const livePriceSeries: IChartSeries[] = useMemo(
    () => [
      {
        id: "price",
        label: "Price",
        color: colors.blue500,
        data: livePriceData,
      },
    ],
    [livePriceData, colors.blue500],
  );

  const trendColors = useMemo(
    () => ({
      up: colors.green500,
      down: colors.red500,
      flat: colors.textTertiary,
    }),
    [colors.green500, colors.red500, colors.textTertiary],
  );

  return (
    <Chart
      series={livePriceSeries}
      height={300}
      yPaddingRatio={0.2}
      padding={{ left: 44, bottom: 36 }}
    >
      <AxisLayerY
        tickCount={4}
        color={colors.slate400}
        labelColor={colors.textTertiary}
      />
      <AxisLayerX
        tickCount={4}
        color={colors.slate400}
        labelColor={colors.textTertiary}
      />
      <GridLayer color={colors.slate200} />
      <AreaLayer
        curve={"smooth"}
        opacity={0.15}
        colorByTrend
        trendColors={trendColors}
      />
      <LineLayer
        curve={"smooth"}
        strokeWidth={2}
        colorByTrend
        trendColors={trendColors}
        showEndDot
        endDotRadius={5}
        endDotStrokeColor={colors.onSurface}
        endDotStrokeWidth={2}
      />
      <CurrentValueLineLayer
        color={colors.blue500}
        labelTextColor={colors.white}
        labelPosition={"left"}
      />
      <CrosshairLayer color={colors.slate400} />
      <TooltipLayer />
    </Chart>
  );
});
