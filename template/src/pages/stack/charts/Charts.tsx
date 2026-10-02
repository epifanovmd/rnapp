import { useScreenReady } from "@shared/lib/navigation";
import { Col, Container, Content, ScrollView, Skeleton, Text } from "@shared/ui";
import React, { FC } from "react";

import { ChartCard } from "./ChartCard";
import { LegendDemo } from "./LegendDemo";
import { LivePriceDemo } from "./LivePriceDemo";
import { RevenueDemo } from "./RevenueDemo";

/** Скелетоны карточек графиков, пока не закончилась анимация открытия. */
const PLACEHOLDER_HEIGHTS = [380, 300, 400];

/** Витрина графиков; до конца анимации открытия — скелетоны. */
export const Charts: FC = () => {
  const ready = useScreenReady();

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

          {ready ? (
            <>
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
            </>
          ) : (
            <Col gap={16}>
              {PLACEHOLDER_HEIGHTS.map((height, index) => (
                <Skeleton key={index} height={height} borderRadius={16} />
              ))}
            </Col>
          )}
        </Content>
      </ScrollView>
    </Container>
  );
};
