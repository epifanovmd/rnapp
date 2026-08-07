import type { HybridObject } from "react-native-nitro-modules";
import type { Frame } from "react-native-vision-camera";

/** Режим распознавания текста: скорость против точности */
export type OcrRecognitionMode = "fast" | "accurate";

/**
 * Ориентация буфера кадра (EXIF-семантика: где находятся 0-я строка и
 * 0-й столбец буфера относительно выпрямленного изображения).
 * "up" — буфер уже выпрямлен, координаты преобразовывать не нужно.
 */
export type OcrBufferOrientation =
  | "up"
  | "upMirrored"
  | "down"
  | "downMirrored"
  | "left"
  | "leftMirrored"
  | "right"
  | "rightMirrored";

/**
 * Прямоугольник в нормализованных координатах [0..1], начало — левый
 * верхний угол. Система координат — буфер кадра (см. `bufferOrientation`).
 */
export interface OcrRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Одна распознанная текстовая область кадра */
export interface OcrObservation {
  text: string;
  /** Уверенность распознавания [0..1] */
  confidence: number;
  rect: OcrRect;
  /** Область предложена обученным детектором, а не полнокадровым OCR */
  fromDetector: boolean;
}

export interface OcrScanResult {
  /**
   * Области в нормализованных координатах буфера (top-left origin, без
   * применения ориентации) — выпрямление выполняет JS-слой по
   * `bufferOrientation` (см. `toUprightRect` в `@shared/lib/ocr-scan`).
   */
  observations: OcrObservation[];
  /** Ориентация буфера; "up" — координаты уже выпрямлены (Android) */
  bufferOrientation: OcrBufferOrientation;
  /** Ширина выпрямленного кадра, px */
  imageWidth: number;
  /** Высота выпрямленного кадра, px */
  imageHeight: number;
  /** Длительность обработки кадра, мс */
  durationMs: number;
  /** Кадр обрабатывался через детектор регионов */
  detectorUsed: boolean;
}

export interface OcrScanOptions {
  mode: OcrRecognitionMode;
  /** Области с уверенностью ниже порога отбрасываются нативно */
  minConfidence: number;
  /** Максимум областей в результате */
  maxObservations: number;
}

/**
 * Универсальный нативный OCR-движок: читает текст кадра, предметной
 * области не знает (домены — в JS-слое приложения).
 *
 * iOS — Apple Vision (`VNRecognizeTextRequest`) + опциональный CoreML-детектор
 * регионов интереса; Android — ML Kit Text Recognition + опциональный
 * TFLite-детектор (любая YOLO-модель регионов в CoreML/TFLite).
 *
 * `scan` синхронный и вызывается из frame-worklet'а VisionCamera
 * (через `NitroModules.box`).
 */
export interface OcrEngine extends HybridObject<{
  ios: "swift";
  android: "kotlin";
}> {
  /**
   * Загрузить обученный детектор регионов кода контейнера.
   * iOS — имя скомпилированной CoreML-модели в бандле (`<name>.mlmodelc`),
   * Android — имя TFLite-модели в assets (`<name>.tflite`).
   * Возвращает `false`, если модель не найдена.
   */
  loadDetector(modelName: string): Promise<boolean>;
  /** Детектор загружен и участвует в `scan` */
  readonly isDetectorLoaded: boolean;
  /** Распознать текстовые области кадра */
  scan(frame: Frame, options: OcrScanOptions): OcrScanResult;
}
