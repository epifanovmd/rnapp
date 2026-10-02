import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import {
  ActivePoint,
  AreaLayer,
  AxisLayerX,
  AxisLayerY,
  Chart,
  ChartMarker,
  CrosshairLayer,
  CurrentValueLineLayer,
  GridLayer,
  LineLayer,
  MarkerLayer,
  RangeLayer,
  TooltipLayer,
} from "@shared/ui/chart";
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  filterByPeriod,
  formatActivePoints,
  formatAxisLabel,
  formatTooltipRow,
  peakRevenue,
  Period,
  PERIODS,
} from "./chart-demo-format";
import { REVENUE_VS_EXPENSES } from "./chart-mock-data";

/** Full-featured пример: периоды, маркеры, два пальца, статус касания. */
export const RevenueDemo: FC = memo(() => {
  const { colors } = useTheme();
  const [touchStatus, setTouchStatus] = useState("Not touching");
  const [activePointLabel, setActivePointLabel] = useState(
    "Drag over the chart",
  );
  const [period, setPeriod] = useState<Period>("month");

  const filteredSeries = useMemo(
    () => filterByPeriod(REVENUE_VS_EXPENSES, period),
    [period],
  );

  const formatPeriodLabel = useCallback(
    (value: number) => formatAxisLabel(value, period),
    [period],
  );

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
      <View style={styles.periods}>
        {PERIODS.map(({ key, label }) => (
          <View
            key={key}
            style={[
              styles.period,
              {
                backgroundColor:
                  period === key ? colors.blue500 : colors.slate200,
              },
            ]}
          >
            <Text
              textStyle={"Body_S2"}
              color={period === key ? "white" : "textSecondary"}
              onPress={() => setPeriod(key)}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      <Chart
        series={filteredSeries}
        height={260}
        yPaddingRatio={0.15}
        padding={{ left: 56, bottom: 36, top: 36 }}
        onActiveChange={handleActiveChange}
        onChange={handleActivePointsChange}
        twoFingerEnabled
      >
        <GridLayer color={colors.slate200} />
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
          color={colors.slate400}
          labelColor={colors.textTertiary}
          formatLabel={formatPeriodLabel}
          // labelSide={"in"}
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
          xLabelFormatter={formatPeriodLabel}
          showYLabels
          // yLabelPosition={"right"}
          secondLineColor={colors.orange500}
        />
        <RangeLayer />
        <TooltipLayer formatRow={formatTooltipRow} />
      </Chart>
      <View style={styles.touchStatus}>
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
  periods: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  period: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  touchStatus: {
    gap: 4,
    marginTop: 8,
  },
});
