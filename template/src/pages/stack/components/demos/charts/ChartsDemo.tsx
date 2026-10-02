import { Container, Content, ScrollView, Text } from "@shared/ui";
import React, { FC } from "react";

import { ChartCard } from "./ChartCard";
import { LegendDemo } from "./LegendDemo";
import { LivePriceDemo } from "./LivePriceDemo";
import { RevenueDemo } from "./RevenueDemo";

/** Витрина графиков кита. */
export const ChartsDemo: FC = () => {
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
            title={"Live — Price ticker"}
            description={
              "Тултип над пальцем слева, у края — справа."
            }
          >
            <LivePriceDemo />
          </ChartCard>

          <ChartCard
            title={"Легенда — включение серий"}
            description={
              "Нажатие по пункту скрывает серию; последнюю видимую выключить нельзя."
            }
          >
            <LegendDemo />
          </ChartCard>

          <ChartCard
            title={"Full-featured — Выручка и расходы"}
            description={
              "Тултип над пальцем слева. Два пальца — диапазон и данные обеих точек."
            }
          >
            <RevenueDemo />
          </ChartCard>
        </Content>
      </ScrollView>
    </Container>
  );
};
