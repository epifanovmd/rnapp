import type { FC } from "react";

export interface ChartDatum {
  x: number;
  y: number;
  label?: string;
  meta?: unknown;
}

export interface IChartSeries {
  id: string;
  label?: string;
  color?: string;
  data: ChartDatum[];
}

export interface IScale {
  readonly domain: [number, number];
  readonly range: [number, number];
  toRange(value: number): number;
  toDomain(value: number): number;
  ticks(count?: number): number[];
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: ChartPadding;
  plotWidth: number;
  plotHeight: number;
}

export type ChartLayerKind = "skia" | "overlay";

export type ChartLayerComponent<P = any> = FC<P> & {
  layerKind?: ChartLayerKind;
};
