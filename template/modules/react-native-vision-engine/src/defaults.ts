import type {
  DetectorAccelerator,
  DetectorBoxUnits,
  DetectorResizeMode,
} from "./specs/VisionEngine.nitro";

/**
 * Дефолты движка — единственный источник значений в рантайме:
 * JS-потребители передают их в конфиге и опциях явно. Нативные фолбэки
 * (на случай вызова без этих полей) обязаны совпадать с ними.
 */
export const VISION_ENGINE_DEFAULTS: {
  /** Подача кадра на вход модели */
  resize: DetectorResizeMode;
  /** Единицы координат выхода модели */
  boxUnits: DetectorBoxUnits;
  /** Вычислитель инференса */
  accelerator: DetectorAccelerator;
  /** Потоки CPU-инференса; 0 — по числу ядер */
  threads: number;
  /** IoU-порог NMS детекций (подавление — внутри класса) */
  iouThreshold: number;
  /** Минимальная сторона области OCR, px */
  minRoiSizePx: number;
} = {
  resize: "letterbox",
  boxUnits: "auto",
  accelerator: "cpu",
  threads: 0,
  iouThreshold: 0.45,
  minRoiSizePx: 32,
};
