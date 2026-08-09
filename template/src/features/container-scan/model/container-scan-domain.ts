import {
  accumulateContainerCandidates,
  EMPTY_CONTAINER_ATTRIBUTES,
  extractContainerAttributes,
  extractContainerCandidates,
  IContainerAttributes,
  mergeContainerAttributes,
  resolveContainerCode,
} from "@shared/lib/container-ocr";
import {
  createOcrDomain,
  IOcrScanCandidate,
  IOcrScanObservation,
} from "@shared/lib/ocr-scan";

/** OCR-области → кандидаты ISO 6346 (адаптер библиотеки к контракту домена) */
function extractCandidates(
  observations: IOcrScanObservation[],
): IOcrScanCandidate[] {
  "worklet";

  const candidates = extractContainerCandidates(observations);
  const result: IOcrScanCandidate[] = [];

  for (let i = 0; i < candidates.length; i++) {
    result.push({
      value: candidates[i].code,
      isValid: candidates[i].isValid,
      confidence: candidates[i].confidence,
      rect: candidates[i].rect,
    });
  }

  return result;
}

/**
 * Скан считается полным, когда кроме кода прочитаны типоразмер и веса
 * (MAX GROSS, TARE, NET/PAYLOAD) — до этого сканирование продолжается.
 */
function isComplete(attributes: IContainerAttributes): boolean {
  "worklet";

  return attributes.sizeTypeCode !== null;
}

/** Домен сканирования кодов морских контейнеров (ISO 6346) */
export const CONTAINER_SCAN_DOMAIN = createOcrDomain<IContainerAttributes>({
  extractCandidates,
  /** Контрольная цифра надёжно отсекает ложные коды — хватает трёх сканов */
  confirmStreak: 3,
  detectorModelName: "container_code_detector",
  emptyAttributes: EMPTY_CONTAINER_ATTRIBUTES,
  extractAttributes: extractContainerAttributes,
  mergeAttributes: mergeContainerAttributes,
  isComplete,
  // код подтверждается и межкадровыми голосами — не требуется полное
  // чтение в трёх сканах подряд
  accumulateCandidates: accumulateContainerCandidates,
  resolveAccumulated: resolveContainerCode,
});
