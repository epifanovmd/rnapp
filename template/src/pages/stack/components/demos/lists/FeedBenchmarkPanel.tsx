import { Chip, Col, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import {
  BENCHMARK_DRAW_DISTANCE,
  FEED_BENCHMARK_SCENARIOS,
  formatBenchmarkResult,
  IFeedBenchmarkResult,
  TFeedBenchmarkScenario,
} from "./feed-benchmark";

interface IFeedBenchmarkPanelProps {
  showBlank: boolean;
  onToggleBlank: () => void;
  alignDrawDistance: boolean;
  onToggleDrawDistance: () => void;
  /** id идущего сценария. */
  running: string | null;
  result: IFeedBenchmarkResult | null;
  onRun: (scenario: TFeedBenchmarkScenario) => void;
}

/** Панель бенчмарка ленты: режимы отображения, сценарии прогона, последний результат. */
export const FeedBenchmarkPanel: FC<IFeedBenchmarkPanelProps> = memo(
  ({
    showBlank,
    onToggleBlank,
    alignDrawDistance,
    onToggleDrawDistance,
    running,
    result,
    onRun,
  }) => (
    <Col ph={16} pv={8} gap={8}>
      <Row wrap gap={8}>
        <Chip text={"Пустоты"} isActive={showBlank} onPress={onToggleBlank} />
        <Chip
          text={`drawDistance ${BENCHMARK_DRAW_DISTANCE}`}
          isActive={alignDrawDistance}
          onPress={onToggleDrawDistance}
          disabled={!!running}
        />
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
