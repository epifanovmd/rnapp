import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import {
  ActivePoint,
  AreaLayer,
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartMarker,
  ChartNavigator,
  ChartRangePresets,
  CrosshairLayer,
  CurrentValueLineLayer,
  formatTimeTick,
  GridLayer,
  LineLayer,
  MarkerLayer,
  RangeLayer,
  TooltipLayer,
  useChartViewport,
  ViewRange,
} from "@shared/ui/chart";
import React, { FC, memo, useCallback, useMemo, useRef } from "react";

import {
  formatActivePoints,
  formatDateTime,
  formatTooltipRow,
  getPeakRevenue,
  TIMEFRAME_PRESETS,
} from "./chart-demo-format";
import { getRevenueSeries } from "./chart-mock-data";
import { IRevenueStatusHandle, RevenueStatus } from "./RevenueStatus";

const DAY = 86_400_000;

/** Отступы — константой: новый объект на рендер сбрасывал бы memo графика. */
const CHART_PADDING = { left: 56, bottom: 36, top: 36 };

/**
 * Full-featured пример: таймфреймы и зум по окну (год по 3 часа — 2920
 * точек на серию без прореживания вручную), навигатор, маркеры, два пальца,
 * статус касания.
 */
export const RevenueDemo: FC = memo(() => {
  const { colors } = useTheme();
  const status = useRef<IRevenueStatusHandle>(null);
  const series = useMemo(getRevenueSeries, []);
  const peak = useMemo(getPeakRevenue, []);

  const handleViewportChange = useCallback(
    (range: ViewRange) =>
      status.current?.setRange(
        `${formatDateTime(range.start)} – ${formatDateTime(range.end)}`,
      ),
    [],
  );

  const viewport = useChartViewport({
    initialSpan: 30 * DAY,
    minSpan: 6 * 3_600_000,
    onChange: handleViewportChange,
  });

  const revenueMarkers: ChartMarker[] = useMemo(
    () => [
      {
        id: "peak",
        anchor: { kind: "series", seriesId: "revenue", x: peak.x / 2 },
        color: colors.red500,
        radius: 4,
      },
      {
        id: "note",
        anchor: { kind: "pixel", x: 44, y: 0 },
        color: colors.orange500,
        radius: 4,
        style: "stroke",
        strokeWidth: 2,
      },
    ],
    [colors.red500, colors.orange500, peak.x],
  );

  const handleActiveChange = useCallback(
    (active: boolean) =>
      status.current?.setTouch(active ? "Touching" : "Not touching"),
    [],
  );

  const handleActivePointsChange = useCallback(
    (primary: ActivePoint[] | null, secondary: ActivePoint[] | null) => {
      const primaryLabel = formatActivePoints(primary);
      const secondaryLabel = secondary ? formatActivePoints(secondary) : null;

      status.current?.setPoint(
        secondaryLabel ? `${primaryLabel}  |  ${secondaryLabel}` : primaryLabel,
      );
    },
    [],
  );

  return (
    <>
      <ChartRangePresets
        viewport={viewport}
        presets={TIMEFRAME_PRESETS}
        mb={12}
      />
      <Chart
        series={series}
        viewport={viewport}
        zoom
        height={260}
        yPaddingRatio={0.15}
        padding={CHART_PADDING}
        onActiveChange={handleActiveChange}
        onChange={handleActivePointsChange}
        twoFingerEnabled
      >
        <GridLayer color={colors.slate200} xTicks={"time"} />
        <AreaLayer curve={"smooth"} opacity={0.15} />
        <LineLayer
          curve={"smooth"}
          strokeWidth={2}
          showEndDot
          endDotRadius={5}
          endDotStrokeColor={colors.onSurface}
          endDotStrokeWidth={2}
        />
        <AxisLayerY
          tickCount={4}
          color={colors.slate400}
          labelColor={colors.textTertiary}
        />
        <AxisLayerX
          tickCount={5}
          ticks={"time"}
          color={colors.slate400}
          labelColor={colors.textTertiary}
        />
        <MarkerLayer markers={revenueMarkers} />
        <CurrentValueLineLayer
          seriesId="revenue"
          color={colors.green500}
          labelPosition="left"
        />
        <CurrentValueLineLayer
          seriesId="expenses"
          color={colors.red500}
          labelPosition="left"
        />
        <CrosshairLayer
          color={colors.slate400}
          showXLabel
          xLabelPosition={"top"}
          xLabelFormatter={formatTimeTick}
          showYLabels
          // yLabelPosition={"right"}
          secondLineColor={colors.orange500}
        />
        <RangeLayer />
        <TooltipLayer formatRow={formatTooltipRow} />
      </Chart>
      <ChartNavigator
        series={series}
        viewport={viewport}
        paddingLeft={56}
        windowColor={colors.blue500}
      />
      <RevenueStatus ref={status} />
    </>
  );
});
