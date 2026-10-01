import { create } from "qrcode/lib/core/qrcode";

/**
 * Матрица QR-кода: `size × size`, `true` — тёмный модуль. Берётся ядро
 * `qrcode` без рендереров: основная точка входа пакета тянет node-модули
 * (`fs`, `pngjs`), которых нет в RN.
 */
export const createQrMatrix = (value: string): boolean[][] => {
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  const { size } = modules;

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (__, col) => !!modules.get(row, col)),
  );
};
