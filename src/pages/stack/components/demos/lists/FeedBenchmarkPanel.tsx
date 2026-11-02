import { Chip, Col, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import {
  BENCHMARK_DRAW_DISTANCES,
  FEED_BENCHMARK_SCENARIOS,
  formatBenchmarkResult,
  formatDrawDistance,
  IFeedBenchmarkResult,
  TFeedBenchmarkScenario,
} from "./feed-benchmark";

interface IFeedBenchmarkPanelProps {
  /** Запас отрисовки; `undefined` — значение списка по умолчанию. */
  drawDistance: number | undefined;
  onDrawDistanceChange: (value: number | undefined) => void;
  /** id идущего сценария. */
  running: string | null;
  result: IFeedBenchmarkResult | null;
  onRun: (scenario: TFeedBenchmarkScenario) => void;
}

/** Панель бенчмарка ленты: запас отрисовки, сценарии прогона, последний результат. */
export const FeedBenchmarkPanel: FC<IFeedBenchmarkPanelProps> = memo(
  ({ drawDistance, onDrawDistanceChange, running, result, onRun }) => (
    <Col ph={16} pv={8} gap={8}>
      <Row wrap alignItems={"center"} gap={8}>
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {"drawDistance"}
        </Text>
        {BENCHMARK_DRAW_DISTANCES.map(value => (
          <Chip
            key={formatDrawDistance(value)}
            text={formatDrawDistance(value)}
            isActive={drawDistance === value}
            onPress={() => onDrawDistanceChange(value)}
            disabled={!!running}
          />
        ))}
      </Row>
      <Row wrap gap={8}>
        {FEED_BENCHMARK_SCENARIOS.map(scenario => (
          <Chip
            key={scenario.id}
            text={scenario.label}
            isActive={running === scenario.id}
            onPress={() => onRun(scenario)}
            disabled={!!running}
          />
        ))}
      </Row>
      <Text textStyle={"Caption_M3"} color={"textSecondary"} numberOfLines={2}>
        {running
          ? "Прогон…"
          : result
            ? formatBenchmarkResult(result)
            : "Прогон: возврат к началу, пауза, скролл по сценарию; итог — здесь и в лог"}
      </Text>
    </Col>
  ),
);
