import type { DerivedValue } from "react-native-reanimated";

export type MarkerAnchor =
  /** Ближайшая точка указанной серии в домен-координате x. */
  | { kind: "series"; seriesId: string; x: number }
  /** Произвольная точка в доменных координатах (переводится в пиксели через `xScale`/`yScale`). */
  | { kind: "domain"; x: number; y: number }
  /** Точка в пиксельных координатах канваса напрямую, без участия шкал. */
  | { kind: "pixel"; x: number; y: number };

export interface ChartMarker {
  /** Уникальный id маркера (используется как React key и передаётся в `onMarkerPress`). */
  id: string;
  /** Где разместить маркер. */
  anchor: MarkerAnchor;
  /** Цвет маркера — задаётся явно, авто-палитры по индексу нет. */
  color: string;
  /** Свой радиус маркера (по умолчанию — `defaultRadius` слоя). */
  radius?: number;
  /** Заливка кружка или только обводка. */
  style?: "fill" | "stroke";
  /** Толщина обводки (px), учитывается при `style="stroke"`. */
  strokeWidth?: number;
}

export interface MarkerCircleProps {
  marker: ChartMarker;
  index: number;
  positions: DerivedValue<({ x: number; y: number } | null)[]>;
  defaultRadius: number;
}

export interface MarkerLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Статичные (не следующие за пальцем) аннотации-маркеры. */
  markers: ChartMarker[];
  /** Радиус маркера, если он не задан в самом `ChartMarker.radius`. */
  defaultRadius?: number;
}
