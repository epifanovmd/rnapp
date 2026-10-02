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
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  formatActivePoints,
  formatDateTime,
  formatTooltipRow,
  peakRevenue,
  TIMEFRAME_PRESETS,
} from "./chart-demo-format";
import { REVENUE_VS_EXPENSES } from "./chart-mock-data";

const DAY = 86_400_000;

/**
 * Full-featured пример: таймфреймы и зум по окну (год по 3 часа — 2920
 * точек на серию без прореживания вручную), навигатор, маркеры, два пальца,
 * статус касания.
 */
export const RevenueDemo: FC = memo(() => {
  const { colors } = useTheme();
  const [touchStatus, setTouchStatus] = useState("Not touching");
  const [activePointLabel, setActivePointLabel] = useState(
    "Hold over the chart",
  );
  const [rangeLabel, setRangeLabel] = useState("");

  const handleViewportChange = useCallback(
    (range: ViewRange) =>
      setRangeLabel(
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
        anchor: { kind: "series", seriesId: "revenue", x: peakRevenue.x / 2 },
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
    [colors.red500, colors.orange500],
  );

  const handleActiveChange = useCallback(
    (active: boolean) => setTouchStatus(active ? "Touching" : "Not touching"),
    [],
  );

  const handleActivePointsChange = useCallback(
    (primary: ActivePoint[] | null, secondary: ActivePoint[] | null) => {
      const primaryLabel = formatActivePoints(primary);
      const secondaryLabel = secondary ? formatActivePoints(secondary) : null;

      setActivePointLabel(
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
        series={REVENUE_VS_EXPENSES}
        viewport={viewport}
        zoom
        height={260}
        yPaddingRatio={0.15}
        padding={{ left: 56, bottom: 36, top: 36 }}
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
        series={REVENUE_VS_EXPENSES}
        viewport={viewport}
        paddingLeft={56}
        windowColor={colors.blue500}
      />
      <View style={styles.touchStatus}>
        {!!rangeLabel && (
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {rangeLabel}
          </Text>
        )}
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {touchStatus}
        </Text>
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {activePointLabel}
        </Text>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  touchStatus: {
    gap: 4,
    marginTop: 8,
  },
});
