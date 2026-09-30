import type {
  DetectOptions,
  DetectorModelConfig,
  DetectorModelInfo,
  OcrOptions,
  OcrRecognitionMode,
} from "react-native-vision-engine";
import { VISION_ENGINE_DEFAULTS } from "react-native-vision-engine";

import { OCR_SCAN_DEFAULTS, REGION_DEFAULTS } from "./defaults";
import { decodeThreshold, IRegionLimits } from "./region-selection";
import {
  IOcrScanDetectorConfig,
  IOcrScanRecognitionConfig,
  IOcrScanRegionConfig,
} from "./types";

/** Перекрытия настроек домена со стороны камеры */
export interface IOcrScanOverrides {
  mode?: OcrRecognitionMode;
  fullFrameFallback?: boolean;
  /** Имена регионов, читаемых OCR; сужает регионы домена */
  regions?: string[];
}

/** Детекторная часть конвейера кадра */
export interface IOcrPipelineDetector {
  /** Имя загруженной модели */
  model: string;
  detect: DetectOptions;
  /** Правила регионов; null — читать все классы модели */
  rules: IOcrScanRegionConfig[] | null;
  limits: IRegionLimits;
}

/** Полностью разрешённые настройки OCR-конвейера кадра (читаются worklet'ом) */
export interface IOcrPipelineConfig {
  /** null — детектора нет или модель не загружена: читается полный кадр */
  detector: IOcrPipelineDetector | null;
  ocr: OcrOptions;
  /** Дочитать полный кадр, когда регионы не дали текста */
  fullFrameFallback: boolean;
}

/** Конфиг модели с явными дефолтами — натив получает полный конфиг */
export const resolveModelConfig = (
  model: DetectorModelConfig,
): DetectorModelConfig => ({
  name: model.name,
  labels: model.labels,
  resize: model.resize ?? VISION_ENGINE_DEFAULTS.resize,
  boxUnits: model.boxUnits ?? VISION_ENGINE_DEFAULTS.boxUnits,
  accelerator: model.accelerator ?? VISION_ENGINE_DEFAULTS.accelerator,
  threads: model.threads ?? VISION_ENGINE_DEFAULTS.threads,
});

/** Регионы домена с учётом перекрытия; null — читать все классы модели */
const resolveRegions = (
  detector: IOcrScanDetectorConfig,
  labels: string[] | undefined,
): IOcrScanRegionConfig[] | null => {
  const configured = detector.regions ?? null;

  if (labels === undefined) {
    return configured;
  }
  if (configured === null) {
    return labels.map(label => ({ label }));
  }

  return configured.filter(region => labels.includes(region.label));
};

/** Детекторная часть конвейера: правила, лимиты и параметры детекции */
const buildDetector = (
  detector: IOcrScanDetectorConfig,
  overrides: IOcrScanOverrides,
): IOcrPipelineDetector => {
  const maxPerClass =
    detector.maxRegionsPerClass ?? REGION_DEFAULTS.maxRegionsPerClass;
  const rules = resolveRegions(detector, overrides.regions);
  // общий лимит по умолчанию — сумма квот регионов: каждый объявленный
  // регион гарантированно попадает в OCR
  const quota =
    rules === null
      ? REGION_DEFAULTS.maxRegions
      : rules.reduce((sum, rule) => sum + (rule.maxCount ?? maxPerClass), 0);

  const limits: IRegionLimits = {
    minScore: detector.minScore ?? REGION_DEFAULTS.minScore,
    maxRegions: detector.maxRegions ?? quota,
    maxPerClass,
    padding: detector.padding ?? REGION_DEFAULTS.padding,
  };

  return {
    model: detector.model.name,
    detect: {
      minScore: decodeThreshold(rules, limits),
      iouThreshold:
        detector.iouThreshold ?? VISION_ENGINE_DEFAULTS.iouThreshold,
    },
    rules,
    limits,
  };
};

/**
 * Настройки домена и перекрытия камеры → конфиг OCR-конвейера кадра.
 * `detector` передаётся только загруженный — без него конвейер читает
 * полный кадр. Не заданное берётся из `OCR_SCAN_DEFAULTS`,
 * `REGION_DEFAULTS` и `VISION_ENGINE_DEFAULTS`.
 */
export const buildOcrPipelineConfig = (
  detector: IOcrScanDetectorConfig | null,
  recognition: IOcrScanRecognitionConfig,
  overrides: IOcrScanOverrides = {},
): IOcrPipelineConfig => {
  return {
    detector: detector === null ? null : buildDetector(detector, overrides),
    ocr: {
      mode: overrides.mode ?? recognition.mode ?? OCR_SCAN_DEFAULTS.mode,
      minConfidence:
        recognition.minConfidence ?? OCR_SCAN_DEFAULTS.minConfidence,
      maxObservations:
        recognition.maxObservations ?? OCR_SCAN_DEFAULTS.maxObservations,
      languages: recognition.languages,
      minRoiSizePx:
        recognition.minRoiSizePx ?? VISION_ENGINE_DEFAULTS.minRoiSizePx,
    },
    fullFrameFallback:
      overrides.fullFrameFallback ??
      recognition.fullFrameFallback ??
      OCR_SCAN_DEFAULTS.fullFrameFallback,
  };
};

/** Подписи регионов оверлея по имени класса */
export const buildRegionTitles = (
  detector: IOcrScanDetectorConfig | null,
): Record<string, string> => {
  const titles: Record<string, string> = {};

  for (const region of detector?.regions ?? []) {
    if (region.title !== undefined) {
      titles[region.label] = region.title;
    }
  }

  return titles;
};

/**
 * Регионы домена, которых нет среди классов модели. Пусто и тогда, когда
 * модель имён классов не содержит — сверять не с чем.
 */
export const findMissingRegions = (
  detector: IOcrScanDetectorConfig | null,
  info: DetectorModelInfo,
): string[] => {
  if (info.labels.length === 0) {
    return [];
  }

  return (detector?.regions ?? [])
    .map(region => region.label)
    .filter(label => !info.labels.includes(label));
};
