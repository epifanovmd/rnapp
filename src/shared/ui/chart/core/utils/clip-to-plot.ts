import { rect, SkRect } from "@shopify/react-native-skia";

import type { ChartPlotRect } from "../types";

/** Запас по X, px: концы линий и скругления не срезаются ровно по краю. */
const CLIP_MARGIN_X = 2;

/** Высота клипа по Y — заведомо больше канваса. */
const CLIP_EXTENT_Y = 100_000;

/**
 * Клип серий по X: при зуме срез с точкой за краем окна уходит за область
 * построения — в отступы (оси, подписи) он не рисуется. По Y не клипуется.
 */
export const clipToPlotX = (plot: ChartPlotRect): SkRect =>
  rect(
    plot.left - CLIP_MARGIN_X,
    -CLIP_EXTENT_Y,
    plot.width + CLIP_MARGIN_X * 2,
    CLIP_EXTENT_Y * 2,
  );
