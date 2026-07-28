import { matchFont } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { defaultLabelFormatter } from "../../core/label-style";
import type { ChartLayerComponent, IChartSeries } from "../../core/types";
import { CrosshairLine } from "./CrosshairLine";

export interface CrosshairLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Цвет вертикальной линии (и второй линии, если `secondLineColor` не задан). */
  color?: string;
  /** Цвета маркеров/чипов по сериям (по кругу, если серий больше). */
  colors?: string[];
  /** Толщина линий (px). */
  strokeWidth?: number;
  /** Радиус маркера в активной точке каждой серии. */
  markerRadius?: number;
  /** Рисовать маркеры (точки) на пересечении с каждой серией. */
  showMarkers?: boolean;
  /** Рисовать вертикальную линию под пальцем. */
  showVerticalLine?: boolean;
  /** Рисовать горизонтальную линию для каждой серии на уровне её активного значения. */
  showHorizontalLines?: boolean;
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Показывать чип со значением X у края графика. */
  showXLabel?: boolean;
  /** С какой стороны рисовать чип X (независимо от `position` у `AxisLayer`). */
  xLabelPosition?: "top" | "bottom";
  /** Форматирует значение X для чипа. */
  xLabelFormatter?: (value: number) => string;
  /** Показывать чипы со значением Y для каждой серии. */
  showYLabels?: boolean;
  /** С какой стороны рисовать чипы Y (независимо от `position` у `AxisLayer`). */
  yLabelPosition?: "left" | "right";
  /** Форматирует значение Y для чипа конкретной серии. */
  yLabelFormatter?: (value: number, series: IChartSeries) => string;
  /** Размер шрифта текста в чипах. */
  labelFontSize?: number;
  /** Шрифт текста в чипах. */
  labelFontFamily?: string;
  /** Цвет фона чипов. */
  labelBackground?: string;
  /** Цвет текста в чипах. */
  labelTextColor?: string;
  /** Рисовать вторую линию, пока активно второе касание (нужен `Chart.twoFingerEnabled`). */
  showSecondTouch?: boolean;
  /** Цвет второй линии/чипов (по умолчанию — как у первой, `color`). */
  secondLineColor?: string;
}

export const CrosshairLayer: ChartLayerComponent<CrosshairLayerProps> = ({
  visible = true,
  color = "#94A3B8",
  colors = DEFAULT_SERIES_COLORS,
  strokeWidth = 1,
  markerRadius = 5,
  showMarkers = true,
  showVerticalLine = true,
  showHorizontalLines = true,
  lineType = "solid",
  dashArray,
  showXLabel = false,
  xLabelPosition = "bottom",
  xLabelFormatter = defaultLabelFormatter,
  showYLabels = false,
  yLabelPosition = "left",
  yLabelFormatter = defaultLabelFormatter,
  labelFontSize = 11,
  labelFontFamily = "System",
  labelBackground = "rgba(15, 23, 42, 0.92)",
  labelTextColor = "#FFFFFF",
  showSecondTouch = true,
  secondLineColor,
}) => {
  const { series, xScale, yScale, dimensions, interaction } = useChartContext();
  const { touchX, isActive, touchX2, isSecondActive } = interaction;
  const intervals = resolveDashIntervals(lineType, dashArray);

  const font = useMemo(
    () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
    [labelFontFamily, labelFontSize],
  );

  if (!visible || !font) {
    return null;
  }

  const sharedLineProps = {
    series,
    xScale,
    yScale,
    dimensions,
    colors,
    strokeWidth,
    markerRadius,
    showVerticalLine,
    showMarkers,
    showHorizontalLines,
    dashIntervals: intervals,
    showXLabel,
    xLabelPosition,
    xLabelFormatter,
    showYLabels,
    yLabelPosition,
    yLabelFormatter,
    font,
    fontSize: labelFontSize,
    labelBackground,
    labelTextColor,
  };

  return (
    <>
      <CrosshairLine
        {...sharedLineProps}
        touchX={touchX}
        active={isActive}
        color={color}
      />
      {showSecondTouch && (
        <CrosshairLine
          {...sharedLineProps}
          touchX={touchX2}
          active={isSecondActive}
          color={secondLineColor ?? color}
        />
      )}
    </>
  );
};

CrosshairLayer.layerKind = "skia";
