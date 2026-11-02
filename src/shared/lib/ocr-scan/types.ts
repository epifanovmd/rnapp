import type { IScanRect } from "@shared/lib/scan-overlay";
import type {
  DetectorModelConfig,
  OcrRecognitionMode,
} from "react-native-vision-engine";

/** Нормализованный [0..1] прямоугольник выпрямленного кадра, top-left origin */
export type IOcrScanRect = IScanRect;

/** Строка текста кадра в выпрямленных координатах */
export interface IOcrScanObservation {
  text: string;
  confidence: number;
  rect: IOcrScanRect;
}

/** Регион детектора кадра и текст, прочитанный из его кропа */
export interface IOcrScanRegion {
  /** Имя класса модели; пустая строка — модель имён не содержит */
  label: string;
  /** Индекс класса модели; -1 — класс не сопоставлен индексу */
  classIndex: number;
  score: number;
  rect: IOcrScanRect;
  /** Кроп прочитан; false — пропущен (слишком мал для OCR) */
  read: boolean;
  observations: IOcrScanObservation[];
}

/**
 * Результат OCR-конвейера кадра: регионы детектора с их текстом и
 * полнокадровый текст (без детектора либо при `fullFrameFallback`).
 */
export interface IOcrScanFrame {
  regions: IOcrScanRegion[];
  fullFrame: IOcrScanObservation[];
  /** Ширина выпрямленного кадра, px */
  imageWidth: number;
  /** Высота выпрямленного кадра, px */
  imageHeight: number;
}

/** Настройки нативного распознавания текста; не заданное берётся из `OCR_SCAN_DEFAULTS` */
export interface IOcrScanRecognitionConfig {
  /** fast — быстрее, accurate — точнее (iOS) */
  mode?: OcrRecognitionMode;
  /** Порог уверенности строки, ниже которого она отбрасывается */
  minConfidence?: number;
  /** Максимум строк на область чтения (регион или полный кадр) */
  maxObservations?: number;
  /**
   * Читать полный кадр, когда кропы детектора не дали текста. Без
   * детектора OCR всегда полнокадровый.
   */
  fullFrameFallback?: boolean;
  /** Языки распознавания в порядке приоритета (iOS, коды BCP 47) */
  languages?: string[];
  /** Минимальная сторона кропа региона, px: меньшие не читаются */
  minRoiSizePx?: number;
}

/**
 * Регион детектора, который читает OCR. Не заданные пороги берутся из
 * общих полей `IOcrScanDetectorConfig`.
 */
export interface IOcrScanRegionConfig {
  /** Имя класса модели */
  label: string;
  /** Подпись региона в оверлее; по умолчанию — имя класса */
  title?: string;
  /** Порог уверенности детекции */
  minScore?: number;
  /** Максимум регионов класса за кадр */
  maxCount?: number;
  /** Расширение региона перед OCR, доля его размеров */
  padding?: number;
}

/**
 * Детектор регионов интереса домена. Модель кладётся в приложение
 * (iOS — `ios/MLModels/<name>.mlpackage`, Android — assets `<name>.tflite`);
 * классы связываются с доменом по именам из метаданных модели.
 * Не заданные поля берутся из `REGION_DEFAULTS`/`VISION_ENGINE_DEFAULTS`.
 */
export interface IOcrScanDetectorConfig {
  /** Модель и способ её прогона */
  model: DetectorModelConfig;
  /** Регионы, которые читает OCR; не задано — все классы модели */
  regions?: IOcrScanRegionConfig[];
  /** Порог уверенности детекции */
  minScore?: number;
  /** Максимум регионов кадра, прогоняемых через OCR; по умолчанию — сумма квот `regions` */
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
  /** Кадр → кандидаты (валидные первыми) */
  extractCandidates: (frame: IOcrScanFrame) => IOcrScanCandidate[];
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
  /** Дополнительные атрибуты кадра; null — домен без атрибутов */
  extractAttributes: ((frame: IOcrScanFrame) => TAttributes) | null;
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
  /** Длительность обработки кадра, мс */
  durationMs: number;
  /** Кадр обрабатывался через детектор регионов */
  detectorUsed: boolean;
  /** Число строк/объектов в результате */
  resultCount: number;
  /** Число регионов детектора, прочитанных OCR */
  regionCount: number;
}
