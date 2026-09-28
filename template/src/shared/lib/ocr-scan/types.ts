import type { IScanRect } from "@shared/lib/scan-overlay";
import type { OcrRecognitionMode } from "react-native-vision-engine";

/** Нормализованный [0..1] прямоугольник выпрямленного кадра, top-left origin */
export type IOcrScanRect = IScanRect;

/** OCR-область кадра в выпрямленных координатах */
export interface IOcrScanObservation {
  text: string;
  confidence: number;
  rect: IOcrScanRect;
  fromDetector: boolean;
  /**
   * Класс региона детектора, из кропа которого прочитан текст;
   * `FULL_FRAME_REGION_CLASS` (-1) — область прочитана полнокадрово.
   * Разбор многоклассовых моделей — через `selectByRegionClass`.
   */
  regionClassIndex: number;
}

/** Настройки нативного распознавания текста; не заданное берётся из `OCR_SCAN_DEFAULTS` */
export interface IOcrScanRecognitionConfig {
  /** fast — быстрее, accurate — точнее (iOS) */
  mode?: OcrRecognitionMode;
  /** Порог уверенности области, ниже которого она отбрасывается нативно */
  minConfidence?: number;
  /** Максимум областей в результате кадра */
  maxObservations?: number;
  /**
   * Читать полный кадр, когда кропы детектора не дали текста. Без
   * детектора OCR всегда полнокадровый.
   */
  fullFrameFallback?: boolean;
}

/**
 * Детектор регионов интереса домена. Модель кладётся вручную:
 * iOS — `ios/MLModels/<modelName>.mlpackage`, Android — assets
 * `<modelName>.tflite`. Не заданные пороги берутся из `DETECTOR_DEFAULTS`.
 */
export interface IOcrScanDetectorConfig {
  /** Имя модели без расширения */
  modelName: string;
  /** Метки классов по индексу — подписи регионов в оверлее */
  classLabels?: string[];
  /**
   * Индексы классов, чьи регионы прогоняются через OCR; не задано или
   * пусто — все классы модели.
   */
  classes?: number[];
  /** Порог уверенности детекции */
  minScore?: number;
  /** Максимум регионов кадра, прогоняемых через OCR */
  maxRegions?: number;
  /** Максимум регионов одного класса за кадр */
  maxRegionsPerClass?: number;
  /** Расширение региона перед OCR, доля его размеров */
  padding?: number;
  /** IoU-порог NMS (подавление — внутри класса) */
  iouThreshold?: number;
}

/** Кандидат значения, извлечённый доменом из OCR-областей */
export interface IOcrScanCandidate {
  /** Каноническое значение (код контейнера, номер и т.п.) */
  value: string;
  /** Прошёл доменную валидацию (контрольная цифра, формат, …) */
  isValid: boolean;
  confidence: number;
  rect: IOcrScanRect;
}

/**
 * Домен распознавания — параметризует универсальный сканер.
 * `extractCandidates`/`extractAttributes`/`mergeAttributes` — worklet-функции,
 * выполняются на потоке камеры.
 */
export interface IOcrScanDomain<TAttributes> {
  /** OCR-области кадра → кандидаты (валидные первыми) */
  extractCandidates: (
    observations: IOcrScanObservation[],
  ) => IOcrScanCandidate[];
  /** Сколько сканов подряд должны дать одно и то же валидное значение */
  confirmStreak: number;
  /** Детектор регионов интереса; null — полнокадровый OCR */
  detector: IOcrScanDetectorConfig | null;
  /** Настройки нативного распознавания домена (камера может их перекрыть) */
  recognition: IOcrScanRecognitionConfig;
  /** Максимум одновременно отображаемых рамок overlay */
  maxOverlayBoxes: number;
  /** Останавливать frame-пайплайн после первого подтверждения */
  suspendOnConfirm: boolean;
  /** Начальное значение накапливаемых атрибутов */
  emptyAttributes: TAttributes;
  /** Дополнительные атрибуты кадра (веса, регион, …); null — домен без атрибутов */
  extractAttributes:
    ((observations: IOcrScanObservation[]) => TAttributes) | null;
  /** Слияние атрибутов между кадрами */
  mergeAttributes:
    ((accumulated: TAttributes, next: TAttributes) => TAttributes) | null;
  /**
   * Готовность накопленных атрибутов: подтверждение откладывается, пока
   * не вернёт true (worklet). null — подтверждать по одному кандидату.
   */
  isComplete: ((attributes: TAttributes) => boolean) | null;
  /**
   * Межкадровое накопление кандидатов в атрибутах (worklet): вызывается
   * после извлечения кандидатов кадра — домен может копить свидетельства
   * (например, голоса за код), чтобы подтверждение не требовало полного
   * чтения в сканах подряд. null — кандидаты между кадрами не копятся.
   */
  accumulateCandidates:
    | ((
        accumulated: TAttributes,
        candidates: IOcrScanCandidate[],
      ) => TAttributes)
    | null;
  /**
   * Вывод подтверждения из накопленного состояния (worklet): ненулевой
   * результат срабатывает как альтернатива серийной стабилизации
   * (гейт `isComplete` применяется и к нему). null — только серия.
   */
  resolveAccumulated:
    ((attributes: TAttributes) => IOcrScanResolved | null) | null;
}

/** Подтверждение, выведенное доменом из накопленных свидетельств */
export interface IOcrScanResolved {
  value: string;
  confidence: number;
}

/** Диагностика кадра для dev-бейджа (собирается только в __DEV__) */
export interface IScanDiagnostics {
  /** Длительность нативной обработки кадра, мс */
  durationMs: number;
  /** Кадр обрабатывался через детектор регионов */
  detectorUsed: boolean;
  /** Число областей/объектов в результате */
  resultCount: number;
  /** Число регионов, которые детектор отдал под OCR */
  regionCount: number;
}
