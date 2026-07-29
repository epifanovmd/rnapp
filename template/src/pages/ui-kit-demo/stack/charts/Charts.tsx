import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import { Container, Content, ScrollView, Text } from "@shared/ui";
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
  IChartSeries,
  LineLayer,
  MarkerLayer,
  TooltipLayer,
} from "@shared/ui/chart";
import { observer } from "mobx-react-lite";
import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

import {
  createInitialLivePriceData,
  nextLivePriceData,
  REVENUE_VS_EXPENSES,
} from "./chart-mock-data";

interface IProps extends StackProps {}

const peakRevenue = REVENUE_VS_EXPENSES[0].data.reduce((best, datum) =>
  datum.y > best.y ? datum : best,
);

// Модуль-скоуп: не зависят от пропсов/состояния компонента, поэтому не нужно
// пересоздавать их на каждый рендер через useCallback — уже стабильны сами по себе.
const formatMonthLabel = (value: number) =>
  REVENUE_VS_EXPENSES[0].data[Math.round(value)]?.label ?? "";

const formatTooltipRow = (point: {
  series: { label?: string };
  datum: { x: number; y: number; label?: string };
}) => {
  const label =
    point.datum.label ?? `(${point.datum.x.toFixed(0)}, ${point.datum.y})`;
  return `${point.series.label}: ${label}`;
};

const formatActivePoints = (points: ActivePoint[] | null) =>
  points
    ? points
        .map(
          point =>
            `${point.series.label}: x=${point.datum.x.toFixed(0)}, y=${point.datum.y}${point.datum.label ? ` (${point.datum.label})` : ""}`,
        )
        .join(" · ")
    : "Drag over the chart";

const ChartCard: FC<
  PropsWithChildren<{ title: string; description?: string }>
> = ({ title, description, children }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.onSurface }]}>
      <Text textStyle={"Title_M"}>{title}</Text>
      {description && (
        <Text textStyle={"Body_S2"} color={"textSecondary"} mb={8}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
};

export const Charts: FC<IProps> = observer(() => {
  const { colors } = useTheme();
  const [touchStatus, setTouchStatus] = useState("Not touching");
  const [activePointLabel, setActivePointLabel] = useState(
    "Drag over the chart",
  );
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

  const revenueMarkers: ChartMarker[] = useMemo(
    () => [
      {
        id: "peak",
        anchor: { kind: "series", seriesId: "revenue", x: peakRevenue.x },
        color: colors.red500,
        radius: 6,
      },
      {
        id: "note",
        anchor: { kind: "pixel", x: 44, y: 28 },
        color: colors.orange500,
        radius: 5,
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
    (points: ActivePoint[] | null) =>
      setActivePointLabel(formatActivePoints(points)),
    [],
  );

  return (
    <Container edges={[]}>
      <ScrollView>
        <Content>
          <Text textStyle={"Title_L"} mb={4}>
            Charts
          </Text>
          <Text textStyle={"Body_S2"} color={"textSecondary"} mb={16}>
            Standard chart types and features built on the Skia + Reanimated
            charting core (`@shared/ui/chart`).
          </Text>

          <ChartCard title={"Live — Price ticker"}>
            <Chart series={livePriceSeries} height={200} yPaddingRatio={0.2}>
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
              <AxisLayerY
                tickCount={4}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <CurrentValueLineLayer
                color={colors.blue500}
                labelTextColor={colors.white}
                labelPosition={"left"}
              />
              <CrosshairLayer color={colors.slate400} />
              <TooltipLayer />
            </Chart>
          </ChartCard>

          <ChartCard title={"Full-featured — Revenue vs expenses"}>
            <Chart
              series={REVENUE_VS_EXPENSES}
              height={260}
              padding={{ top: 40, left: 16, right: 56 }}
              onActiveChange={handleActiveChange}
              onChange={handleActivePointsChange}
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
                position={"right"}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <AxisLayerX
                tickCount={5}
                color={colors.slate400}
                labelColor={colors.textTertiary}
                formatLabel={formatMonthLabel}
              />
              <MarkerLayer markers={revenueMarkers} />
              <CrosshairLayer
                color={colors.slate400}
                showXLabel
                xLabelPosition={"top"}
                xLabelFormatter={formatMonthLabel}
                showYLabels
                yLabelPosition={"left"}
                secondLineColor={colors.orange500}
              />
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
              <TooltipLayer
                anchorToPoint
                side={"bottom"}
                formatRow={formatTooltipRow}
              />
            </Chart>
            <View style={{ gap: 4, marginTop: 8 }}>
              <Text textStyle={"Body_S2"} color={"textSecondary"}>
                {touchStatus}
              </Text>
              <Text textStyle={"Body_S2"} color={"textSecondary"}>
                {activePointLabel}
              </Text>
            </View>
          </ChartCard>
        </Content>
      </ScrollView>
    </Container>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
});
