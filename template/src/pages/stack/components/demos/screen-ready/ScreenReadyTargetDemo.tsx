import { ScreenProps, useScreenReady } from "@shared/lib/navigation";
import { Col, Skeleton, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { DemoScreen } from "../DemoScreen";
import {
  HEAVY_CHART_COUNT,
  HEAVY_CHART_HEIGHT,
  HeavyCharts,
} from "./HeavyCharts";

type TScreenReadyTargetParams = { delay?: number } | undefined;

/** Тяжёлый экран: до готовности — скелетоны, после — графики. */
export const ScreenReadyTargetDemo: FC<
  ScreenProps<TScreenReadyTargetParams>
> = memo(({ route }) => {
  const delay = route.params?.delay ?? 0;
  const ready = useScreenReady({ delay });

  return (
    <DemoScreen>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {ready
          ? "Экран готов: анимация открытия закончилась, контент смонтирован."
          : `Ждём фокус и конец анимации открытия${delay ? ` + ${delay} мс` : ""}…`}
      </Text>
      {ready ? (
        <HeavyCharts />
      ) : (
        <Col gap={12}>
          {Array.from({ length: HEAVY_CHART_COUNT }, (_, index) => (
            <Skeleton
              key={index}
              height={HEAVY_CHART_HEIGHT + 16}
              borderRadius={16}
            />
          ))}
        </Col>
      )}
    </DemoScreen>
  );
});
