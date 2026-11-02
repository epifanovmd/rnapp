import type { DetectedObject } from "react-native-vision-engine";

import { IOcrScanRegionConfig } from "./types";

/** Общие значения отбора для регионов без собственного правила */
export interface IRegionLimits {
  minScore: number;
  maxRegions: number;
  maxPerClass: number;
  padding: number;
}

/** Детекция, отобранная под OCR, с отступом кропа */
export interface ISelectedRegion {
  detection: DetectedObject;
  padding: number;
}

/**
 * Порог детекции: минимальный из общего и порогов правил, чтобы детектор
 * не отсёк класс с более мягким правилом.
 */
export const decodeThreshold = (
  rules: IOcrScanRegionConfig[] | null,
  limits: IRegionLimits,
): number => {
  "worklet";

  let threshold = limits.minScore;

  if (rules !== null) {
    for (let i = 0; i < rules.length; i++) {
      const minScore = rules[i].minScore;

      if (minScore !== undefined && minScore < threshold) {
        threshold = minScore;
      }
    }
  }

  return threshold;
};

/**
 * Детекции (по убыванию score) → регионы под OCR. С правилами читаются
 * только их классы, каждый со своими порогом, квотой и отступом; без
 * правил (`null`) — все классы по общим значениям. Общий лимит —
 * `limits.maxRegions`.
 */
export const selectRegions = (
  detections: DetectedObject[],
  rules: IOcrScanRegionConfig[] | null,
  limits: IRegionLimits,
): ISelectedRegion[] => {
  "worklet";

  const selected: ISelectedRegion[] = [];
  const counts: Record<string, number> = {};

  for (let i = 0; i < detections.length; i++) {
    if (selected.length >= limits.maxRegions) {
      break;
    }
    const detection = detections[i];
    let rule: IOcrScanRegionConfig | undefined;

    if (rules !== null) {
      for (let j = 0; j < rules.length && rule === undefined; j++) {
        if (rules[j].label === detection.label) {
          rule = rules[j];
        }
      }
      if (rule === undefined) {
        continue;
      }
    }
    if (detection.score < (rule?.minScore ?? limits.minScore)) {
      continue;
    }
    const quota = rule?.maxCount ?? limits.maxPerClass;
    const key =
      detection.label !== "" ? detection.label : `#${detection.classIndex}`;
    const used = counts[key] ?? 0;

    if (quota > 0 && used >= quota) {
      continue;
    }
    counts[key] = used + 1;
    selected.push({ detection, padding: rule?.padding ?? limits.padding });
  }

  return selected;
};
