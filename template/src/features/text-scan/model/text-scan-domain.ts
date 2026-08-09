import {
  createOcrDomain,
  IOcrScanCandidate,
  IOcrScanObservation,
} from "@shared/lib/ocr-scan";

/** Кандидатов нет — домен только стримит OCR-области */
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
export const TEXT_SCAN_DOMAIN = createOcrDomain({ extractCandidates });
