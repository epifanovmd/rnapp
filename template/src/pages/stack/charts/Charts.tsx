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
  RangeLayer,
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
const MONTHS_SHORT = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const formatAxisLabel = (value: number, period: Period) => {
  const d = new Date(value);

  switch (period) {
    case "day":
      return `${String(d.getHours()).padStart(2, "0")}:00`;
    case "week":
      return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}`;
    case "month":
      return `${d.getDate()}.${d.getMonth() + 1}`;
    case "year":
      return MONTHS_SHORT[d.getMonth()];
  }
};

const formatTooltipRow = (point: {
  series: { label?: string };
  datum: { x: number; y: number; label?: string };
}) => {
  const label = point.datum.label
    ? `${point.datum.y} (${point.datum.label})`
    : `${point.datum.y}`;

  return `${point.series.label}: ${label}`;
};

const toDateStr = (ts: number) => {
  const d = new Date(ts);

  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

const formatActivePoints = (points: ActivePoint[] | null) =>
  points
    ? points
        .map(point => {
          const label = point.datum.label
            ? `${point.datum.y} (${point.datum.label})`
            : `${point.datum.y}`;
          const raw = `x=${toDateStr(point.datum.x)}, y=${point.datum.y}`;

          return `${point.series.label}: ${label} [${raw}]`;
        })
        .join(" · ")
    : "Drag over the chart";

type Period = "day" | "week" | "month" | "year";

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
];

const LAST_DATE = new Date(2025, 11, 31).getTime();

const filterByPeriod = (
  series: IChartSeries[],
  period: Period,
): IChartSeries[] => {
  const limits: Record<Period, number> = {
    day: LAST_DATE - 86_400_000,
    week: LAST_DATE - 7 * 86_400_000,
    month: LAST_DATE - 30 * 86_400_000,
    year: 0,
  };
  const from = limits[period];

  return series.map(s => ({
    ...s,
    data: from > 0 ? s.data.filter(d => d.x >= from) : s.data,
  }));
};

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
  const [period, setPeriod] = useState<Period>("year");

  const filteredSeries = useMemo(
    () => filterByPeriod(REVENUE_VS_EXPENSES, period),
    [period],
  );

  const formatPeriodLabel = useCallback(
    (value: number) => formatAxisLabel(value, period),
    [period],
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
          </ChartCard>

          <ChartCard title={"Full-featured — Выручка и расходы"}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {PERIODS.map(({ key, label }) => (
                <View
                  key={key}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor:
                      period === key ? colors.blue500 : colors.slate200,
                  }}
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
