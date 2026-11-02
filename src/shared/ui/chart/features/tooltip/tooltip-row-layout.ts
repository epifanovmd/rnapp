export interface TooltipRowMetrics {
  paddingX: number;
  paddingY: number;
  rowHeight: number;
  dotRadius: number;
  fontSize: number;
}

export interface TooltipRowLayout {
  dotX: number;
  dotY: number;
  textX: number;
  textY: number;
}

/** Позиция точки и текста строки тултипа по её индексу (worklet). */
export const tooltipRowLayout = (
  boxX: number,
  boxY: number,
  index: number,
  metrics: TooltipRowMetrics,
): TooltipRowLayout => {
  "worklet";

  const { paddingX, paddingY, rowHeight, dotRadius, fontSize } = metrics;
  const centerY = boxY + paddingY + rowHeight * index + rowHeight / 2;

  return {
    dotX: boxX + paddingX + dotRadius,
    dotY: centerY,
    textX: boxX + paddingX * 2 + dotRadius * 2,
    textY: centerY + fontSize * 0.3,
  };
};
