import { FULL_FRAME_REGION_CLASS } from "./defaults";
import { IOcrScanObservation } from "./types";

/**
 * Области, прочитанные из региона заданного класса. Если детектор классы
 * не размечал (полнокадровый OCR — все области с `FULL_FRAME_REGION_CLASS`),
 * возвращаются все области: домен одинаково работает и без модели.
 */
export function selectByRegionClass(
  observations: IOcrScanObservation[],
  classIndex: number,
): IOcrScanObservation[] {
  "worklet";

  const matched: IOcrScanObservation[] = [];
  let hasClassified = false;

  for (let i = 0; i < observations.length; i++) {
    const observation = observations[i];

    if (observation.regionClassIndex !== FULL_FRAME_REGION_CLASS) {
      hasClassified = true;
    }
    if (observation.regionClassIndex === classIndex) {
      matched.push(observation);
    }
  }

  return hasClassified ? matched : observations;
}
