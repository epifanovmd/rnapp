import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import { Container, Content, ScrollView, Text } from "@shared/ui";
import {
  ActivePointListener,
  ActiveTooltipPoint,
  AreaLayer,
  AxisLayer,
  BarLayer,
  Chart,
  CrosshairLayer,
  GridLayer,
  Legend,
  LineLayer,
  MarkerLayer,
  ReferenceLineLayer,
  ScatterLayer,
  TooltipLayer,
} from "@shared/ui/chart";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  DAILY_ACTIVE_USERS,
  ORDER_VALUES,
  REVENUE_VS_EXPENSES,
  TEMPERATURE_TREND,
  WEEKLY_SALES,
} from "./chart-mock-data";

interface IProps extends StackProps {}

const peakTemperature = TEMPERATURE_TREND[0].data.reduce((best, datum) =>
  datum.y > best.y ? datum : best,
);

const averageOrderValue =
  ORDER_VALUES[0].data.reduce((sum, datum) => sum + datum.y, 0) /
  ORDER_VALUES[0].data.length;

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

const CustomTooltipContent: FC<{ points: ActiveTooltipPoint[] }> = ({
  points,
}) => {
  const point = points[0];

  if (!point) {
    return null;
  }

  return (
    <View style={[styles.customTooltip, { backgroundColor: point.color }]}>
      <Text textStyle={"Body_S1"} color={"white"}>
        {point.datum.label ?? point.datum.y}
      </Text>
    </View>
  );
};

export const Charts: FC<IProps> = observer(() => {
  const { colors } = useTheme();
  const [touchStatus, setTouchStatus] = useState("Not touching");
  const [selectedBar, setSelectedBar] = useState("No bar selected");
  const [selectedOrder, setSelectedOrder] = useState("No point selected");
  const [selectedMarker, setSelectedMarker] = useState("No marker selected");
  const [activePointLabel, setActivePointLabel] = useState(
    "Drag over the chart",
  );

  const seriesColors = [
    colors.blue500,
    colors.green500,
    colors.orange500,
    colors.red500,
  ];

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

          <ChartCard
            title={"Line — Daily active users"}
            description={`Custom tooltip + onActiveChange event. ${touchStatus}`}
          >
            <Chart
              series={DAILY_ACTIVE_USERS}
              height={200}
              onActiveChange={active =>
                setTouchStatus(active ? "Touching" : "Not touching")
              }
            >
              <GridLayer color={colors.slate200} />
              <LineLayer
                curve={"smooth"}
                strokeWidth={1}
                colors={seriesColors}
              />
              <AxisLayer
                orientation={"y"}
                tickCount={5}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <CrosshairLayer color={colors.slate400} colors={seriesColors} />
              <TooltipLayer
                renderContent={points => (
                  <CustomTooltipContent points={points} />
                )}
              />
            </Chart>
          </ChartCard>

          <ChartCard
            title={"Area + Line — Revenue vs expenses"}
            description={"Two series; y-axis drawn on the right this time."}
          >
            <Legend
              series={REVENUE_VS_EXPENSES}
              textColor={colors.textSecondary}
            />
            <Chart
              series={REVENUE_VS_EXPENSES}
              height={220}
              padding={{ left: 16, right: 48 }}
            >
              <GridLayer color={colors.slate200} />
              <AreaLayer curve={"smooth"} />
              <LineLayer curve={"smooth"} strokeWidth={2} />
              <AxisLayer
                orientation={"y"}
                tickCount={4}
                position={"right"}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <AxisLayer
                orientation={"x"}
                tickCount={5}
                color={colors.slate400}
                labelColor={colors.textTertiary}
                formatLabel={value =>
                  REVENUE_VS_EXPENSES[0].data[Math.round(value)]?.label ?? ""
                }
              />
              <CrosshairLayer color={colors.slate400} />
              <TooltipLayer />
            </Chart>
          </ChartCard>

          <ChartCard
            title={"Bar — Weekly sales by channel"}
            description={`Grouped bars, one band per week. Tap a bar. ${selectedBar}`}
          >
            <Legend series={WEEKLY_SALES} textColor={colors.textSecondary} />
            <Chart series={WEEKLY_SALES} height={200} includeZero>
              <GridLayer
                showXLines={false}
                lineType={"dashed"}
                color={colors.slate200}
              />
              <BarLayer
                borderColor={colors.onSurface}
                borderWidth={1}
                onBarPress={({ seriesId, datum }) =>
                  setSelectedBar(`${seriesId}: ${datum.label} = ${datum.y}`)
                }
              />
              <AxisLayer
                orientation={"y"}
                tickCount={4}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <CrosshairLayer showMarkers={false} color={colors.slate400} />
              <TooltipLayer />
            </Chart>
          </ChartCard>

          <ChartCard
            title={"Scatter + reference line — Order values"}
            description={`Tap a point to select it. ${selectedOrder}`}
          >
            <Chart series={ORDER_VALUES} height={200} yPaddingRatio={0.15}>
              <GridLayer color={colors.slate200} />
              <ReferenceLineLayer
                axis={"y"}
                value={averageOrderValue}
                color={colors.red500}
                label={"avg"}
                labelColor={colors.red500}
              />
              <ScatterLayer
                radius={5}
                onPointPress={({ datum }) =>
                  setSelectedOrder(`${datum.label}: $${datum.y}`)
                }
              />
              <AxisLayer
                orientation={"y"}
                tickCount={4}
                color={colors.slate400}
                labelColor={colors.textTertiary}
              />
              <TooltipLayer />
            </Chart>
          </ChartCard>

          <ChartCard
            title={"Full-featured — Temperature trend"}
            description={`Grid, axes, crosshair with value chips on the opposite edge from each axis, markers, active-point listener and tooltip together. ${activePointLabel} ${selectedMarker}`}
          >
            <Chart
              series={TEMPERATURE_TREND}
              height={220}
              padding={{ top: 40, right: 56 }}
            >
              <GridLayer color={colors.slate200} />
              <AreaLayer curve={"smooth"} opacity={0.18} />
              <LineLayer curve={"smooth"} strokeWidth={2.5} />
              <AxisLayer
                orientation={"y"}
                tickCount={4}
                color={colors.slate400}
                labelColor={colors.textTertiary}
                formatLabel={v => `${v}°`}
              />
              <AxisLayer
                orientation={"x"}
                tickCount={4}
                color={colors.slate400}
                labelColor={colors.textTertiary}
                formatLabel={value =>
                  TEMPERATURE_TREND[0].data[Math.round(value)]?.label ?? ""
                }
              />
              <MarkerLayer
                markers={[
                  {
                    id: "peak",
                    anchor: {
                      kind: "series",
                      seriesId: "temperature",
                      x: peakTemperature.x / 2,
                    },
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
                ]}
                onMarkerPress={marker =>
                  setSelectedMarker(`Marker: ${marker.id}`)
                }
              />
              <CrosshairLayer
                showXLabel
                xLabelPosition={"bottom"}
                xLabelFormatter={value =>
                  TEMPERATURE_TREND[0].data[Math.round(value)]?.label ?? ""
                }
                showYLabels
                yLabelPosition={"left"}
                yLabelFormatter={value => `${value.toFixed(1)}°`}
              />
              <ActivePointListener
                onChange={points =>
                  setActivePointLabel(
                    points
                      ? `${points[0].datum.label}: ${points[0].datum.y.toFixed(1)}°`
                      : "Drag over the chart",
                  )
                }
              />
              <TooltipLayer anchorToPoint side={"bottom"} />
            </Chart>
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
  customTooltip: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
