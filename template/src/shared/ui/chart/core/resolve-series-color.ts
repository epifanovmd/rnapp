export const resolveSeriesColor = (
  series: { color?: string },
  index: number,
  colors: string[],
): string => series.color ?? colors[index % colors.length];
