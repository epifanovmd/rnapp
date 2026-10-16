import { IOcrScanObservation } from "@shared/lib/ocr-scan";

/** Разница по вертикали, в пределах которой области — одна строка */
const SAME_LINE_DELTA_Y = 0.02;

/**
 * Строки скана в порядке чтения: сверху вниз, в строке — слева направо.
 * Области группируются в строки от верхней области строки, поэтому
 * порядок не зависит от порядка областей на входе.
 */
export const toReadingOrder = (
  observations: IOcrScanObservation[],
): string[] => {
  const byY = observations
    .slice()
    .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);
  const rows: IOcrScanObservation[][] = [];

  for (const observation of byY) {
    const row = rows[rows.length - 1];

    if (row && observation.rect.y - row[0].rect.y < SAME_LINE_DELTA_Y) {
      row.push(observation);
    } else {
      rows.push([observation]);
    }
  }

  return rows.flatMap(row =>
    row
      .sort((a, b) => a.rect.x - b.rect.x)
      .map(observation => observation.text),
  );
};
