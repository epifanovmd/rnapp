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
  /** Свой цвет маркера (по умолчанию — из `colors` слоя, по кругу). */
  color?: string;
  /** Свой радиус маркера (по умолчанию — `defaultRadius` слоя). */
  radius?: number;
  /** Заливка кружка или только обводка. */
  style?: "fill" | "stroke";
  /** Толщина обводки (px), учитывается при `style="stroke"`. */
  strokeWidth?: number;
}
