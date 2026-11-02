import {
  collectCandidates,
  createOcrDomain,
  IOcrScanCandidate,
  IOcrScanFrame,
  IOcrScanObservation,
} from "@shared/lib/ocr-scan";
import { extractPlateCandidates } from "@shared/lib/plate-ocr";

/** Строки одной области чтения → кандидаты автономера */
const extractAreaCandidates = (
  observations: IOcrScanObservation[],
): IOcrScanCandidate[] => {
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
};

/** Кандидаты кадра: по каждому региону номера отдельно, без детектора — по полному кадру */
const extractCandidates = (frame: IOcrScanFrame): IOcrScanCandidate[] => {
  "worklet";

  return collectCandidates(frame, null, extractAreaCandidates);
};

/** Домен сканирования российских автономеров */
export const PLATE_SCAN_DOMAIN = createOcrDomain({
  extractCandidates,
  /** У номера нет контрольной цифры — серия подтверждения длиннее */
  confirmStreak: 4,
  // модель одноклассовая — читаются все её регионы
  detector: { model: { name: "plate_detector" } },
});
