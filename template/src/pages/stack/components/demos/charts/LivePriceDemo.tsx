import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "@shared/lib/theme";
import {
  AreaLayer,
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartRangePresets,
  CrosshairLayer,
  CurrentValueLineLayer,
  GridLayer,
  IChartSeries,
  LineLayer,
  TooltipLayer,
  useChartViewport,
} from "@shared/ui/chart";
import React, { FC, memo, useEffect, useMemo, useState } from "react";

import { LIVE_PRESETS } from "./chart-demo-format";
import {
  createInitialLivePriceData,
  nextLivePriceData,
} from "./chart-mock-data";

/**
 * Live-тикер: свой таймер и состояние — тики не перерисовывают соседние
 * примеры. Окно у правого края едет за новыми точками; прокрученное в
 * прошлое — стоит, пока его не вернут к концу.
 */
export const LivePriceDemo: FC = memo(() => {
  const { colors } = useTheme();
  const viewport = useChartViewport({ initialSpan: 30, minSpan: 10 });
  const [livePriceData, setLivePriceData] = useState(
    createInitialLivePriceData,
  );

  // Тикает, только пока экран виден.
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused) return;

    const interval = setInterval(() => {
      setLivePriceData(previous => nextLivePriceData(previous));
    }, 500);

    return () => clearInterval(interval);
  }, [focused]);

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
    <>
      <ChartRangePresets viewport={viewport} presets={LIVE_PRESETS} mb={12} />
      <Chart
        series={livePriceSeries}
        viewport={viewport}
        zoom
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
    </>
  );
});
