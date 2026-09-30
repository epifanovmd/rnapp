import {
  IOcrScanCandidate,
  IOcrScanFrame,
  IOcrScanObservation,
  IOcrScanRegion,
} from "./types";

/** В кадре есть регионы детектора (иначе текст прочитан полнокадрово) */
export const hasDetectorRegions = (frame: IOcrScanFrame): boolean => {
  "worklet";

  return frame.regions.length > 0;
};

/** Регионы класса `label` */
export const regionsOf = (
  frame: IOcrScanFrame,
  label: string,
): IOcrScanRegion[] => {
  "worklet";

  const matched: IOcrScanRegion[] = [];

  for (let i = 0; i < frame.regions.length; i++) {
    if (frame.regions[i].label === label) {
      matched.push(frame.regions[i]);
    }
  }

  return matched;
};

/** Текст всех регионов класса `label` одним списком */
export const regionObservations = (
  frame: IOcrScanFrame,
  label: string,
): IOcrScanObservation[] => {
  "worklet";

  const observations: IOcrScanObservation[] = [];
  const regions = regionsOf(frame, label);

  for (let i = 0; i < regions.length; i++) {
    for (let j = 0; j < regions[i].observations.length; j++) {
      observations.push(regions[i].observations[j]);
    }
  }

  return observations;
};

/** Весь текст кадра одним списком: регионы, затем полный кадр */
export const frameObservations = (
  frame: IOcrScanFrame,
): IOcrScanObservation[] => {
  "worklet";

  const observations: IOcrScanObservation[] = [];

  for (let i = 0; i < frame.regions.length; i++) {
    for (let j = 0; j < frame.regions[i].observations.length; j++) {
      observations.push(frame.regions[i].observations[j]);
    }
  }
  for (let i = 0; i < frame.fullFrame.length; i++) {
    observations.push(frame.fullFrame[i]);
  }

  return observations;
};

/**
 * Кандидаты кадра: извлечение идёт по каждому региону отдельно (текст
 * разных регионов не смешивается), без регионов — по полному кадру.
 * `label` ограничивает регионы классом; null — все регионы. Одинаковые
 * значения сливаются с лучшей уверенностью; порядок — валидные первыми,
 * затем по уверенности.
 */
export const collectCandidates = (
  frame: IOcrScanFrame,
  label: string | null,
  extract: (observations: IOcrScanObservation[]) => IOcrScanCandidate[],
): IOcrScanCandidate[] => {
  "worklet";

  const sources: IOcrScanObservation[][] = [];

  if (hasDetectorRegions(frame)) {
    for (let i = 0; i < frame.regions.length; i++) {
      if (label === null || frame.regions[i].label === label) {
        sources.push(frame.regions[i].observations);
      }
    }
  } else {
    sources.push(frame.fullFrame);
  }

  const merged: IOcrScanCandidate[] = [];

  for (let i = 0; i < sources.length; i++) {
    if (sources[i].length === 0) {
      continue;
    }
    const candidates = extract(sources[i]);

    for (let j = 0; j < candidates.length; j++) {
      const candidate = candidates[j];
      let existing = -1;

      for (let k = 0; k < merged.length && existing === -1; k++) {
        if (merged[k].value === candidate.value) {
          existing = k;
        }
      }
      if (existing === -1) {
        merged.push(candidate);
      } else if (candidate.confidence > merged[existing].confidence) {
        merged[existing] = candidate;
      }
    }
  }

  return merged.sort((a, b) =>
    a.isValid === b.isValid ? b.confidence - a.confidence : a.isValid ? -1 : 1,
  );
};
