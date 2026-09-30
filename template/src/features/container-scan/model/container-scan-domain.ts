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
  collectCandidates,
  createOcrDomain,
  hasDetectorRegions,
  IOcrScanCandidate,
  IOcrScanFrame,
  IOcrScanObservation,
  regionObservations,
} from "@shared/lib/ocr-scan";

/**
 * Классы детектора контейнеров по назначению — имена из метаданных модели.
 * Модель опциональна: без неё области кадра разбираются целиком.
 */
const CONTAINER_REGIONS = {
  /** Код ISO 6346 целиком, с контрольной цифрой */
  code: "container_code",
  /** Типоразмер (size-type) */
  sizeType: "container_type",
  /** Табличка весов целиком */
  weightPlate: "container_weight",
  /** Брутто (MAX GROSS) */
  maxGross: "max_gross",
  /** Тара (TARE) */
  tare: "tare",
  /** Нетто (NET / PAYLOAD) */
  net: "net",
} as const;

/** Отступ кропа отдельного веса: рамка уже охватывает подпись и числа */
const WEIGHT_FIELD_PADDING = 0.1;

/**
 * Сколько кадров с уже подтверждённым кодом ждать типоразмер и веса,
 * прежде чем отдать результат без них: таблички попадают в кадр не всегда,
 * а бесконечное сканирование хуже неполного результата.
 */
const ATTRIBUTES_GRACE_FRAMES = 30;

/** Строки одной области чтения → кандидаты ISO 6346 */
const extractCodeCandidates = (
  observations: IOcrScanObservation[],
): IOcrScanCandidate[] => {
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
};

/**
 * Кандидаты кадра: по каждому региону кода отдельно — фрагменты кодов
 * разных контейнеров не склеиваются; без детектора — по полному кадру.
 */
const extractCandidates = (frame: IOcrScanFrame): IOcrScanCandidate[] => {
  "worklet";

  return collectCandidates(
    frame,
    CONTAINER_REGIONS.code,
    extractCodeCandidates,
  );
};

/**
 * Регионы типоразмера и весов → атрибуты кадра. Без детектора полный кадр
 * разбирается как типоразмер и табличка весов: роли чисел определяются
 * подписями, а не регионами.
 */
const extractAttributes = (frame: IOcrScanFrame): IContainerAttributes => {
  "worklet";

  if (!hasDetectorRegions(frame)) {
    return extractContainerAttributes({
      sizeType: frame.fullFrame,
      weightPlate: frame.fullFrame,
      maxGross: [],
      tare: [],
      net: [],
    });
  }

  return extractContainerAttributes({
    sizeType: regionObservations(frame, CONTAINER_REGIONS.sizeType),
    weightPlate: regionObservations(frame, CONTAINER_REGIONS.weightPlate),
    maxGross: regionObservations(frame, CONTAINER_REGIONS.maxGross),
    tare: regionObservations(frame, CONTAINER_REGIONS.tare),
    net: regionObservations(frame, CONTAINER_REGIONS.net),
  });
};

/**
 * Скан полон, когда кроме кода прочитаны типоразмер и брутто с тарой;
 * пока их нет, подтверждение откладывается на `ATTRIBUTES_GRACE_FRAMES`
 * кадров, после чего результат отдаётся с тем, что успело прочитаться.
 */
const isComplete = (attributes: IContainerAttributes): boolean => {
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
};

/** Домен сканирования кодов морских контейнеров (ISO 6346) */
export const CONTAINER_SCAN_DOMAIN = createOcrDomain<IContainerAttributes>({
  extractCandidates,
  /** Контрольная цифра надёжно отсекает ложные коды — хватает трёх сканов */
  confirmStreak: 3,
  // После подтверждения продолжаем обновлять detector/OCR overlay;
  // callback подтверждения при этом остаётся одноразовым до resume().
  suspendOnConfirm: false,
  /** Регионы + кандидаты + строки текста */
  maxOverlayBoxes: 30,
  /** Строк на регион: кропы небольшие, больше не бывает */
  recognition: { maxObservations: 8 },
  detector: {
    model: { name: "container_code_detector", accelerator: "gpu" },
    // каждая область на контейнере одна; табличка целиком не читается —
    // веса приходят отдельными регионами
    maxRegionsPerClass: 1,
    regions: [
      { label: CONTAINER_REGIONS.code, title: "номер" },
      { label: CONTAINER_REGIONS.sizeType, title: "тип" },
      {
        label: CONTAINER_REGIONS.maxGross,
        title: "брутто",
        padding: WEIGHT_FIELD_PADDING,
      },
      {
        label: CONTAINER_REGIONS.tare,
        title: "тара",
        padding: WEIGHT_FIELD_PADDING,
      },
      {
        label: CONTAINER_REGIONS.net,
        title: "нетто",
        padding: WEIGHT_FIELD_PADDING,
      },
    ],
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
