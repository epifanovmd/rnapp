export type MarkerAnchor =
  | { kind: "series"; seriesId: string; x: number }
  | { kind: "domain"; x: number; y: number }
  | { kind: "pixel"; x: number; y: number };

export interface ChartMarker {
  id: string;
  anchor: MarkerAnchor;
  color?: string;
  radius?: number;
  style?: "fill" | "stroke";
  strokeWidth?: number;
}
