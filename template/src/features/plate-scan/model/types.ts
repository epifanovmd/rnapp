import { IPlateParts } from "@shared/lib/plate-ocr";

/** Подтверждённый стабилизацией результат сканирования автономера */
export interface IPlateScanResult {
  /** Каноническое значение латиницей: "A123BC77" */
  value: string;
  /** Для отображения: "А 123 ВС 77" */
  formatted: string;
  parts: IPlateParts;
  confidence: number;
}
