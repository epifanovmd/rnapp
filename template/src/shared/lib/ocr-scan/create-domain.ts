import {
  IOcrScanCandidate,
  IOcrScanDomain,
  IOcrScanObservation,
} from "./types";

/** Конфиг домена: обязателен только `extractCandidates`, остальное — опции */
export interface IOcrDomainConfig<TAttributes = null> {
  /** OCR-области кадра → кандидаты (валидные первыми), worklet */
  extractCandidates: (
    observations: IOcrScanObservation[],
  ) => IOcrScanCandidate[];
  /**
   * Сколько сканов подряд должны дать одно валидное значение;
   * по умолчанию подтверждения нет — домен только стримит области
   */
  confirmStreak?: number;
  /** Имя обученной модели детектора регионов (без расширения) */
  detectorModelName?: string;
  emptyAttributes?: TAttributes;
  extractAttributes?: (observations: IOcrScanObservation[]) => TAttributes;
  mergeAttributes?: (
    accumulated: TAttributes,
    next: TAttributes,
  ) => TAttributes;
  isComplete?: (attributes: TAttributes) => boolean;
  accumulateCandidates?: (
    accumulated: TAttributes,
    candidates: IOcrScanCandidate[],
  ) => TAttributes;
  resolveAccumulated?: (attributes: TAttributes) => {
    value: string;
    confidence: number;
  } | null;
}

/**
 * Фабрика доменов сканирования: разворачивает частичный конфиг в полный
 * `IOcrScanDomain`, чтобы домены описывали только свою логику, а не
 * заполняли неиспользуемые поля контракта.
 */
export function createOcrDomain<TAttributes = null>(
  config: IOcrDomainConfig<TAttributes>,
): IOcrScanDomain<TAttributes> {
  return {
    extractCandidates: config.extractCandidates,
    confirmStreak: config.confirmStreak ?? Number.MAX_SAFE_INTEGER,
    detectorModelName: config.detectorModelName ?? null,
    emptyAttributes: (config.emptyAttributes ?? null) as TAttributes,
    extractAttributes: config.extractAttributes ?? null,
    mergeAttributes: config.mergeAttributes ?? null,
    isComplete: config.isComplete ?? null,
    accumulateCandidates: config.accumulateCandidates ?? null,
    resolveAccumulated: config.resolveAccumulated ?? null,
  };
}
