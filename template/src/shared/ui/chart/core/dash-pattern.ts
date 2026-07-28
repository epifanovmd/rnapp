export type LineDashType = "solid" | "dashed" | "dotted";

const DASH_PRESETS: Record<Exclude<LineDashType, "solid">, number[]> = {
  dashed: [6, 4],
  dotted: [1, 3],
};

export const resolveDashIntervals = (
  lineType: LineDashType,
  dashArray?: number[],
): number[] | undefined =>
  dashArray ?? (lineType === "solid" ? undefined : DASH_PRESETS[lineType]);
