import {
  createOcrDomain,
  IOcrScanCandidate,
  IOcrScanFrame,
} from "@shared/lib/ocr-scan";

/** Кандидатов нет — домен только стримит OCR-области */
const extractCandidates = (_frame: IOcrScanFrame): IOcrScanCandidate[] => {
  "worklet";

  return [];
};

/**
 * Домен распознавания произвольного текста: кандидатов и подтверждения
 * нет — поток строк уходит в JS через `onObservations`.
 */
export const TEXT_SCAN_DOMAIN = createOcrDomain({ extractCandidates });
