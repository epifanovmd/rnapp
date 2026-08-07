import {
  IOcrScanCandidate,
  IOcrScanDomain,
  IOcrScanObservation,
} from "@shared/lib/ocr-scan";
import { extractPlateCandidates } from "@shared/lib/plate-ocr";

/** OCR-области → кандидаты автономера (адаптер библиотеки к контракту домена) */
function extractCandidates(
  observations: IOcrScanObservation[],
): IOcrScanCandidate[] {
  "worklet";

  const candidates = extractPlateCandidates(observations);
  const result: IOcrScanCandidate[] = [];

  for (let i = 0; i < candidates.length; i++) {
    result.push({
      value: candidates[i].value,
      isValid: candidates[i].isValid,
      confidence: candidates[i].confidence,
      rect: candidates[i].rect,
    });
  }

  return result;
}

/** Домен сканирования российских автономеров */
export const PLATE_SCAN_DOMAIN: IOcrScanDomain<null> = {
  extractCandidates,
  /** У номера нет контрольной цифры — серия подтверждения длиннее */
  confirmStreak: 4,
  detectorModelName: "plate_detector",
  emptyAttributes: null,
  extractAttributes: null,
  mergeAttributes: null,
  isComplete: null,
  accumulateCandidates: null,
  resolveAccumulated: null,
};
