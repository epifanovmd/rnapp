import type { OcrRecognitionMode } from "react-native-vision-engine";

/** Класс области, прочитанной полнокадровым OCR (регион детектора не участвовал) */
export const FULL_FRAME_REGION_CLASS = -1;

/**
 * Дефолты распознавания: применяются, когда их не задал ни домен
 * (`IOcrScanDomain.recognition`), ни камера (пропы `mode`/`fullFrameFallback`).
 */
export const OCR_SCAN_DEFAULTS: {
  mode: OcrRecognitionMode;
  minConfidence: number;
  maxObservations: number;
  fullFrameFallback: boolean;
} = {
  mode: "accurate",
  minConfidence: 0.25,
  /** Хватает на несколько регионов сразу: код + типоразмер + строки таблички весов */
  maxObservations: 24,
  fullFrameFallback: false,
};
