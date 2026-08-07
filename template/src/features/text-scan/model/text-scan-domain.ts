import {
  IOcrScanCandidate,
  IOcrScanDomain,
  IOcrScanObservation,
} from "@shared/lib/ocr-scan";

function extractCandidates(
  _observations: IOcrScanObservation[],
): IOcrScanCandidate[] {
  "worklet";

  return [];
}

/**
 * Домен распознавания произвольного текста: кандидатов и подтверждения
 * нет — поток областей уходит в JS через `onObservations`.
 */
export const TEXT_SCAN_DOMAIN: IOcrScanDomain<null> = {
  extractCandidates,
  confirmStreak: Number.MAX_SAFE_INTEGER,
  detectorModelName: null,
  emptyAttributes: null,
  extractAttributes: null,
  mergeAttributes: null,
  isComplete: null,
};
