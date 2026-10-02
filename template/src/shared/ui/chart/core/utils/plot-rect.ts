import type { ChartDimensions, ChartPlotRect } from "../types";

/** Область построения по размерам канваса и отступам. */
export const resolvePlotRect = (
  dimensions: ChartDimensions,
): ChartPlotRect => ({
  left: dimensions.padding.left,
  right: dimensions.width - dimensions.padding.right,
  top: dimensions.padding.top,
  bottom: dimensions.height - dimensions.padding.bottom,
  width: dimensions.plotWidth,
  height: dimensions.plotHeight,
});
