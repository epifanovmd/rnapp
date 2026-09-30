import { VISION_ENGINE_DEFAULTS } from "react-native-vision-engine";

import { REGION_DEFAULTS } from "../defaults";
import {
  buildOcrPipelineConfig,
  buildRegionTitles,
  findMissingRegions,
  resolveModelConfig,
} from "../pipeline-config";
import { IOcrScanDetectorConfig } from "../types";

const detector: IOcrScanDetectorConfig = {
  model: { name: "detector" },
  maxRegionsPerClass: 1,
  regions: [
    { label: "code", title: "номер", padding: 0.2 },
    { label: "type" },
    { label: "net", maxCount: 2, minScore: 0.2 },
  ],
};

const modelInfo = (labels: string[]) => ({
  loaded: true,
  labels,
  classCount: labels.length,
  inputWidth: 640,
  inputHeight: 640,
});

describe("buildOcrPipelineConfig", () => {
  it("без детектора читает полный кадр", () => {
    expect(buildOcrPipelineConfig(null, {}).detector).toBeNull();
  });

  it("общий лимит по умолчанию — сумма квот регионов", () => {
    const config = buildOcrPipelineConfig(detector, {});

    expect(config.detector?.model).toBe("detector");
    expect(config.detector?.limits.maxRegions).toBe(4);
    expect(config.detector?.rules?.map(rule => rule.label)).toEqual([
      "code",
      "type",
      "net",
    ]);
  });

  it("порог детекции — самый мягкий из общего и порогов регионов", () => {
    expect(buildOcrPipelineConfig(detector, {}).detector?.detect.minScore).toBe(
      0.2,
    );
  });

  it("явный лимит домена перекрывает сумму квот", () => {
    expect(
      buildOcrPipelineConfig({ ...detector, maxRegions: 2 }, {}).detector
        ?.limits.maxRegions,
    ).toBe(2);
  });

  it("без регионов читает все классы с общим лимитом", () => {
    const config = buildOcrPipelineConfig({ model: { name: "detector" } }, {});

    expect(config.detector?.rules).toBeNull();
    expect(config.detector?.limits.maxRegions).toBe(REGION_DEFAULTS.maxRegions);
  });

  it("перекрытие камеры сужает регионы домена", () => {
    const config = buildOcrPipelineConfig(detector, {}, { regions: ["code"] });

    expect(config.detector?.rules?.map(rule => rule.label)).toEqual(["code"]);
    expect(config.detector?.limits.maxRegions).toBe(1);
  });

  it("перекрытие камеры и настройки распознавания", () => {
    const config = buildOcrPipelineConfig(
      null,
      { mode: "fast", languages: ["ru-RU"], maxObservations: 5 },
      { mode: "accurate", fullFrameFallback: true },
    );

    expect(config.ocr).toMatchObject({
      mode: "accurate",
      languages: ["ru-RU"],
      maxObservations: 5,
      minRoiSizePx: VISION_ENGINE_DEFAULTS.minRoiSizePx,
    });
    expect(config.fullFrameFallback).toBe(true);
  });
});

describe("resolveModelConfig", () => {
  it("дополняет конфиг модели дефолтами, сохраняя заданное", () => {
    expect(
      resolveModelConfig({ name: "detector", accelerator: "gpu" }),
    ).toEqual({
      name: "detector",
      labels: undefined,
      resize: VISION_ENGINE_DEFAULTS.resize,
      boxUnits: VISION_ENGINE_DEFAULTS.boxUnits,
      accelerator: "gpu",
      threads: VISION_ENGINE_DEFAULTS.threads,
    });
  });
});

describe("buildRegionTitles", () => {
  it("собирает подписи заданных регионов", () => {
    expect(buildRegionTitles(detector)).toEqual({ code: "номер" });
  });
});

describe("findMissingRegions", () => {
  it("находит регионы, которых нет среди классов модели", () => {
    expect(findMissingRegions(detector, modelInfo(["code", "net"]))).toEqual([
      "type",
    ]);
  });

  it("не сверяет модель без имён классов", () => {
    expect(findMissingRegions(detector, modelInfo([]))).toEqual([]);
  });
});
