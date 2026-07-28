import { RoundedRect } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { useOnTouchDown } from "../../core/interaction/useOnTouchDown";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartDatum, ChartLayerComponent } from "../../core/types";
import { computeBaselineY } from "../../scales/compute-baseline";
import { createBandScale } from "../../scales/createBandScale";

export interface BarPressInfo {
  /** id серии, которой принадлежит нажатый бар. */
  seriesId: string;
  /** Точка данных, которой соответствует нажатый бар. */
  datum: ChartDatum;
  /** Индекс точки внутри данных серии. */
  index: number;
}

export interface BarLayerProps extends SeriesSelector {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Радиус скругления углов бара (px). */
  cornerRadius?: number;
  /** Доля ширины полосы (band), оставляемая под зазор между группами баров (0–1). */
  gapRatio?: number;
  /** Цвета по сериям (по кругу, если серий больше); переопределяется собственным `series.color`. */
  colors?: string[];
  /** Цвет обводки бара. */
  borderColor?: string;
  /** Толщина обводки бара (px). */
  borderWidth?: number;
  /** Срабатывает при нажатии на бар (хит-тест по уже отрисованным прямоугольникам). */
  onBarPress?: (info: BarPressInfo) => void;
}

export const BarLayer: ChartLayerComponent<BarLayerProps> = ({
  visible = true,
  cornerRadius = 4,
  gapRatio = 0.3,
  colors = DEFAULT_SERIES_COLORS,
  borderColor,
  borderWidth = 0,
  onBarPress,
  ...selector
}) => {
  const { series, yScale, dimensions, interaction } = useChartContext();
  const resolvedSeries = selectSeries(series, selector);
  const categoryCount = resolvedSeries[0]?.data.length ?? 0;

  const bandScale = useMemo(
    () =>
      createBandScale({
        count: categoryCount,
        range: [
          dimensions.padding.left,
          dimensions.width - dimensions.padding.right,
        ],
        paddingRatio: gapRatio,
      }),
    [
      categoryCount,
      dimensions.width,
      dimensions.padding.left,
      dimensions.padding.right,
      gapRatio,
    ],
  );

  const baselineY = useMemo(() => computeBaselineY(yScale), [yScale]);

  const subBandWidth = bandScale.bandwidth / Math.max(resolvedSeries.length, 1);

  const bars = useMemo(
    () =>
      resolvedSeries.flatMap((item, seriesIndex) =>
        item.data.map((datum, categoryIndex) => {
          const x = bandScale.start(categoryIndex) + subBandWidth * seriesIndex;
          const y = yScale.toRange(datum.y);
          const top = Math.min(y, baselineY);
          const height = Math.abs(baselineY - y);

          return {
            key: `${item.id}-${categoryIndex}`,
            seriesId: item.id,
            datum,
            index: categoryIndex,
            x,
            y: top,
            width: subBandWidth,
            height,
            color: resolveSeriesColor(item, seriesIndex, colors),
          };
        }),
      ),
    [resolvedSeries, bandScale, subBandWidth, yScale, baselineY, colors],
  );

  useOnTouchDown(
    interaction.touchX,
    interaction.touchY,
    interaction.isActive,
    (x, y) => {
      if (!onBarPress) {
        return;
      }

      const hit = bars.find(
        bar =>
          x >= bar.x &&
          x <= bar.x + bar.width &&
          y >= bar.y &&
          y <= bar.y + bar.height,
      );

      if (hit) {
        onBarPress({
          seriesId: hit.seriesId,
          datum: hit.datum,
          index: hit.index,
        });
      }
    },
  );

  if (!visible || categoryCount === 0) {
    return null;
  }

  const showBorder = !!borderColor && borderWidth > 0;

  return (
    <>
      {bars.map(bar => {
        const r = Math.min(cornerRadius, bar.width / 2, bar.height);

        return (
          <React.Fragment key={bar.key}>
            <RoundedRect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              r={r}
              color={bar.color}
            />
            {showBorder && (
              <RoundedRect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                r={r}
                style="stroke"
                strokeWidth={borderWidth}
                color={borderColor}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

BarLayer.layerKind = "skia";
