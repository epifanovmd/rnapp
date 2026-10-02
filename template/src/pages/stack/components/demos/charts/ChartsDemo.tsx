import { Container, Content, ScrollView, Text } from "@shared/ui";
import React, { FC } from "react";

import { BigDataDemo } from "./BigDataDemo";
import { ChartCard } from "./ChartCard";
import { LegendDemo } from "./LegendDemo";
import { LivePriceDemo } from "./LivePriceDemo";
import { RevenueDemo } from "./RevenueDemo";
import { SyncedChartsDemo } from "./SyncedChartsDemo";

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
              "Окно у правого края едет за новыми точками. Тяните — прокрутка в историю, два пальца — зум, удержание — тултип."
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
              "Таймфреймы, прокрутка с инерцией, зум двумя пальцами, двойной тап, навигатор. Удержание — перекрестие; удержание двумя пальцами — диапазон."
            }
          >
            <RevenueDemo />
          </ChartCard>

          <ChartCard
            title={"Синхронный зум"}
            description={"Два графика на одном окне просмотра."}
          >
            <SyncedChartsDemo />
          </ChartCard>

          <ChartCard
            title={"100 000 точек"}
            description={
              "Уровень детализации по окну: на кадр — не больше точек, чем пикселей."
            }
          >
            <BigDataDemo />
          </ChartCard>
        </Content>
      </ScrollView>
    </Container>
  );
};
