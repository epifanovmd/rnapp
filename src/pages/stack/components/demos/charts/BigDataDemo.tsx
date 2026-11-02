import { useTheme } from "@shared/lib/theme";
import { Button, Col, Text } from "@shared/ui";
import {
  AreaLayer,
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartNavigator,
  ChartRangePresets,
  CrosshairLayer,
  formatTimeTick,
  GridLayer,
  IChartSeries,
  LineLayer,
  TooltipLayer,
  useChartViewport,
} from "@shared/ui/chart";
import React, { FC, memo, useCallback, useState } from "react";

import { MINUTE_PRESETS } from "./chart-demo-format";
import { createRandomWalk } from "./chart-mock-data";

const POINTS = 100_000;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * 100 000 точек (≈ 69 суток по минуте): на кадр рисуется не больше точек,
 * чем пикселей по ширине, — уровень детализации выбирается по окну.
 * Данные строятся по нажатию, чтобы не тормозить открытие экрана.
 */
export const BigDataDemo: FC = memo(() => {
  const { colors } = useTheme();
  const viewport = useChartViewport({ initialSpan: DAY });
  const [series, setSeries] = useState<IChartSeries[] | null>(null);

  const generate = useCallback(() => {
    setSeries([
      {
        id: "walk",
        label: "Цена",
        color: colors.blue500,
        data: createRandomWalk(POINTS, MINUTE, Date.now()),
      },
    ]);
  }, [colors.blue500]);

  if (!series) {
    return (
      <Button
        title={"Построить 100 000 точек"}
        appearance={"outline"}
        onPress={generate}
      />
    );
  }

  return (
    <Col gap={12}>
      <ChartRangePresets viewport={viewport} presets={MINUTE_PRESETS} />
      <Chart
        series={series}
        viewport={viewport}
        zoom
        height={240}
        yPaddingRatio={0.1}
        padding={{ left: 48, bottom: 32, top: 16 }}
      >
        <GridLayer color={colors.slate200} xTicks={"time"} />
        <AreaLayer opacity={0.12} />
        <LineLayer strokeWidth={1.5} />
        <AxisLayerY
          tickCount={4}
          color={colors.slate400}
          labelColor={colors.textTertiary}
        />
        <AxisLayerX
          tickCount={4}
          ticks={"time"}
          color={colors.slate400}
          labelColor={colors.textTertiary}
        />
        <CrosshairLayer
          color={colors.slate400}
          showXLabel
          xLabelFormatter={formatTimeTick}
        />
        <TooltipLayer />
      </Chart>
      <ChartNavigator
        series={series}
        viewport={viewport}
        paddingLeft={48}
        windowColor={colors.blue500}
      />
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {`${POINTS.toLocaleString("ru-RU")} точек`}
      </Text>
    </Col>
  );
});
