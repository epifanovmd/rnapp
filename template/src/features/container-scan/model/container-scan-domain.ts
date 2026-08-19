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
  selectByRegionClass,
} from "@shared/lib/ocr-scan";

/**
 * Классы модели `container_code_detector` (порядок — как в data.yaml
 * обучения). Модель опциональна: без неё все области кадра приходят
 * без класса и разбираются теми же правилами.
 */
export const CONTAINER_REGION_CLASSES = {
  /** Код контейнера ISO 6346 */
  code: 0,
  /** Типоразмер (size-type) */
  type: 1,
  /** Табличка весов */
  weight: 2,
} as const;

/** Подписи регионов в оверлее — по индексу класса */
const CONTAINER_CLASS_LABELS = ["номер", "тип", "веса"];

/**
 * Сколько кадров с уже подтверждённым кодом ждать типоразмер и веса,
 * прежде чем отдать результат без них: таблички попадают в кадр не всегда,
 * а бесконечное сканирование хуже неполного результата.
 */
const ATTRIBUTES_GRACE_FRAMES = 30;

/** OCR-области региона кода → кандидаты ISO 6346 */
function extractCandidates(
  observations: IOcrScanObservation[],
): IOcrScanCandidate[] {
  "worklet";

  const candidates = extractContainerCandidates(
    selectByRegionClass(observations, CONTAINER_REGION_CLASSES.code),
  );
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

/** Области регионов типоразмера и весов → атрибуты кадра */
function extractAttributes(
  observations: IOcrScanObservation[],
): IContainerAttributes {
  "worklet";

  return extractContainerAttributes({
    sizeType: selectByRegionClass(observations, CONTAINER_REGION_CLASSES.type),
    weights: selectByRegionClass(observations, CONTAINER_REGION_CLASSES.weight),
  });
}

/**
 * Скан полон, когда кроме кода прочитаны типоразмер и брутто с тарой;
 * пока их нет, подтверждение откладывается на `ATTRIBUTES_GRACE_FRAMES`
 * кадров, после чего результат отдаётся с тем, что успело прочитаться.
 */
function isComplete(attributes: IContainerAttributes): boolean {
  "worklet";

  const { maxGrossKg, tareKg } = attributes.weights;

  if (
    attributes.sizeTypeCode !== null &&
    maxGrossKg !== null &&
    tareKg !== null
  ) {
    return true;
  }

  return attributes.framesSinceCode >= ATTRIBUTES_GRACE_FRAMES;
}

/** Домен сканирования кодов морских контейнеров (ISO 6346) */
export const CONTAINER_SCAN_DOMAIN = createOcrDomain<IContainerAttributes>({
  extractCandidates,
  /** Контрольная цифра надёжно отсекает ложные коды — хватает трёх сканов */
  confirmStreak: 3,
  detector: {
    modelName: "container_code_detector",
    classLabels: CONTAINER_CLASS_LABELS,
    // каждая область на контейнере одна: номер, табличка типа, табличка весов
    maxRegionsPerClass: 1,
    maxRegions: 3,
  },
  emptyAttributes: EMPTY_CONTAINER_ATTRIBUTES,
  extractAttributes,
  mergeAttributes: mergeContainerAttributes,
  isComplete,
  // код подтверждается и межкадровыми голосами — не требуется полное
  // чтение в трёх сканах подряд
  accumulateCandidates: accumulateContainerCandidates,
  resolveAccumulated: resolveContainerCode,
});
