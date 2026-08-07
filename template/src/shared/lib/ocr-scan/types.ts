/** Нормализованный [0..1] прямоугольник выпрямленного кадра, top-left origin */
export interface IOcrScanRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
}

/** Бокс оверлея в нормализованных координатах кадра */
export interface IOcrOverlayBox {
  rect: IOcrScanRect;
  /** null — обычная OCR-область; иначе кандидат (валидный/нет) */
  isValidCandidate: boolean | null;
}

/** Снимок распознавания одного кадра для отрисовки оверлея */
export interface IOcrOverlaySnapshot {
  boxes: IOcrOverlayBox[];
  imageWidth: number;
  imageHeight: number;
  /** Монотонный номер снимка — оверлей перерисовывается только по изменению */
  revision: number;
}

export const EMPTY_OCR_OVERLAY: IOcrOverlaySnapshot = {
  boxes: [],
  imageWidth: 0,
  imageHeight: 0,
  revision: 0,
};
