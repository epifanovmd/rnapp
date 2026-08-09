import type { IScanRect } from "@shared/lib/scan-overlay";

/** Нормализованный [0..1] прямоугольник выпрямленного кадра, top-left origin */
export type IOcrScanRect = IScanRect;

/** OCR-область кадра в выпрямленных координатах */
export interface IOcrScanObservation {
  text: string;
  confidence: number;
  rect: IOcrScanRect;
  fromDetector: boolean;
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
  /** Имя обученной модели детектора регионов (без расширения); null — без детектора */
  detectorModelName: string | null;
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
}
