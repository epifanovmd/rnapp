import React, {
  Children,
  FC,
  isValidElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { LayoutChangeEvent, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ChartCanvas } from "./ChartCanvas";
import { ChartProvider } from "./ChartProvider";
import { useChartInteraction } from "./interaction/useChartInteraction";
import {
  ChartDimensions,
  ChartLayerKind,
  ChartPadding,
  IChartSeries,
} from "./types";

const DEFAULT_PADDING: ChartPadding = {
  top: 16,
  right: 16,
  bottom: 24,
  left: 40,
};
const DEFAULT_HEIGHT = 220;

export interface ChartProps {
  /** Серии данных для отрисовки; также определяют авто-домены x/y, если `xDomain`/`yDomain` не заданы. */
  series: IChartSeries[];
  /** Фиксированная ширина (px); без неё ширина измеряется через `onLayout` (растягивается на родителя). */
  width?: number;
  /** Высота графика (px). По умолчанию 220. */
  height?: number;
  /** Отступы области построения (место под оси/подписи вокруг рабочей зоны). Мёржится поверх дефолта. */
  padding?: Partial<ChartPadding>;
  /** Фиксированный домен оси X `[min, max]`; без него вычисляется из данных `series`. */
  xDomain?: [number, number];
  /** Фиксированный домен оси Y `[min, max]`; без него вычисляется из данных `series`. */
  yDomain?: [number, number];
  /** Заставляет авто-домен Y включать 0, чтобы высота баров/области не искажала восприятие. */
  beginAtZero?: boolean;
  /** Доп. запас по краям авто-домена X, в долях от его размаха. */
  xPaddingRatio?: number;
  /** Доп. запас по краям авто-домена Y, в долях от его размаха. */
  yPaddingRatio?: number;
  /** Меняет местами края, на которые проецируются min/max домена X (зеркалит график по горизонтали). */
  xReverse?: boolean;
  /** Меняет местами края, на которые проецируются min/max домена Y (зеркалит график по вертикали). */
  yReverse?: boolean;
  /** Включает жест pan (кроссхейр, тултип, события нажатия). `false` — статичный/read-only график. */
  interactive?: boolean;
  /** Расстояние (px, в любом направлении), которое должен пройти палец до активации pan-жеста. */
  panActivationDistance?: number;
  /** Горизонтальный диапазон (px) активации pan-жеста. По умолчанию `[-8, 8]` — этого вместе с `panFailOffsetY` достаточно, чтобы график не перехватывал вертикальный скролл родительского `ScrollView`. */
  panActiveOffsetX?: number | [number, number];
  /** Вертикальный диапазон (px), при выходе за который pan-жест сдаётся в пользу родительского `ScrollView`. По умолчанию `[-8, 8]`. */
  panFailOffsetY?: number | [number, number];
  /** Отслеживать второе одновременное касание (доступно в контексте как `touchX2`/`isSecondActive`) — для второго кроссхейра. */
  twoFingerEnabled?: boolean;
  /** Срабатывает при начале/окончании (первого) касания. */
  onActiveChange?: (active: boolean) => void;
  /** Слои-компоненты — распределяются между Skia-канвасом и оверлеем по собственному `layerKind` каждого потомка. */
  children?: ReactNode;
}

const layerKindOf = (node: ReactNode): ChartLayerKind => {
  if (!isValidElement(node)) {
    return "skia";
  }

  const kind = (node.type as { layerKind?: ChartLayerKind }).layerKind;

  return kind ?? "skia";
};

export const Chart: FC<ChartProps> = ({
  series,
  width: widthProp,
  height: heightProp,
  padding: paddingProp,
  xDomain,
  yDomain,
  beginAtZero,
  xPaddingRatio,
  yPaddingRatio,
  xReverse,
  yReverse,
  interactive = true,
  panActivationDistance = 0,
  panActiveOffsetX = [-8, 8],
  panFailOffsetY = [-8, 8],
  twoFingerEnabled = true,
  onActiveChange,
  children,
}) => {
  const [measuredWidth, setMeasuredWidth] = useState(widthProp ?? 0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setMeasuredWidth(previous =>
      previous === nextWidth ? previous : nextWidth,
    );
  }, []);

  const width = widthProp ?? measuredWidth;
  const height = heightProp ?? DEFAULT_HEIGHT;

  const padding = useMemo<ChartPadding>(
    () => ({ ...DEFAULT_PADDING, ...paddingProp }),
    [paddingProp],
  );

  const dimensions = useMemo<ChartDimensions>(
    () => ({
      width,
      height,
      padding,
      plotWidth: Math.max(width - padding.left - padding.right, 0),
      plotHeight: Math.max(height - padding.top - padding.bottom, 0),
    }),
    [width, height, padding],
  );

  const interaction = useChartInteraction(dimensions, {
    enabled: interactive,
    minDistance: panActivationDistance,
    activeOffsetX: panActiveOffsetX,
    failOffsetY: panFailOffsetY,
    twoFingerEnabled,
  });

  const interactionState = useMemo(
    () => ({
      touchX: interaction.touchX,
      touchY: interaction.touchY,
      isActive: interaction.isActive,
      touchX2: interaction.touchX2,
      touchY2: interaction.touchY2,
      isSecondActive: interaction.isSecondActive,
    }),
    [
      interaction.touchX,
      interaction.touchY,
      interaction.isActive,
      interaction.touchX2,
      interaction.touchY2,
      interaction.isSecondActive,
    ],
  );

  useAnimatedReaction(
    () => interaction.isActive.value,
    (next, previous) => {
      if (next !== previous && onActiveChange) {
        scheduleOnRN(onActiveChange, next);
      }
    },
    [interaction.isActive, onActiveChange],
  );

  const childArray = Children.toArray(children);
  const skiaChildren = childArray.filter(
    child => layerKindOf(child) === "skia",
  );
  const overlayChildren = childArray.filter(
    child => layerKindOf(child) === "overlay",
  );

  const ready = dimensions.width > 0 && dimensions.height > 0;

  return (
    <View style={{ width: widthProp, height }} onLayout={onLayout}>
      {ready && (
        <ChartProvider
          series={series}
          dimensions={dimensions}
          xDomain={xDomain}
          yDomain={yDomain}
          beginAtZero={beginAtZero}
          xPaddingRatio={xPaddingRatio}
          yPaddingRatio={yPaddingRatio}
          xReverse={xReverse}
          yReverse={yReverse}
          interaction={interactionState}
        >
          <ChartCanvas
            gesture={interaction.gesture}
            skiaChildren={skiaChildren}
          />
          {overlayChildren}
        </ChartProvider>
      )}
    </View>
  );
};
