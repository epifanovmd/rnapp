import type { OcrRecognitionMode, OcrRect } from "react-native-vision-engine";

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
  /** На одну область чтения — регион или полный кадр */
  maxObservations: 24,
  fullFrameFallback: false,
};

/** Дефолты отбора регионов детектора под OCR */
export const REGION_DEFAULTS = {
  /** Порог уверенности региона */
  minScore: 0.35,
  /** Максимум регионов кадра без объявленных регионов домена */
  maxRegions: 6,
  /** Максимум регионов одного класса за кадр */
  maxRegionsPerClass: 2,
  /** Расширение региона перед OCR, доля его размеров */
  padding: 0.18,
} as const;

/** Область чтения «весь кадр» */
export const FULL_FRAME_RECT: OcrRect = { x: 0, y: 0, width: 1, height: 1 };
