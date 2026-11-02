import { IScanOverlayBox } from "@shared/lib/scan-overlay";
import type { FrameSession, OcrRoi } from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";

import { FULL_FRAME_RECT } from "./defaults";
import { IOcrPipelineConfig } from "./pipeline-config";
import { selectRegions } from "./region-selection";
import {
  IOcrScanCandidate,
  IOcrScanDomain,
  IOcrScanFrame,
  IOcrScanRegion,
  IOcrScanResolved,
} from "./types";

/** Серия одинаковых валидных кандидатов подряд */
export interface IOcrStreak {
  code: string;
  count: number;
}

/**
 * OCR-конвейер кадра над сессией: детекция → отбор регионов по правилам →
 * чтение кропов одним проходом (`texts[i]` — текст `selected[i]`). Полный
 * кадр читается без детектора либо при `fullFrameFallback`, когда
 * регионы не дали текста.
 */
export const runOcrPipeline = (
  session: FrameSession,
  config: IOcrPipelineConfig,
): IOcrScanFrame => {
  "worklet";

  const regions: IOcrScanRegion[] = [];
  let hasText = false;

  if (config.detector !== null) {
    const selected = selectRegions(
      session.detect(config.detector.model, config.detector.detect),
      config.detector.rules,
      config.detector.limits,
    );

    if (selected.length > 0) {
      const rois: OcrRoi[] = [];

      for (let i = 0; i < selected.length; i++) {
        rois.push({
          rect: selected[i].detection.rect,
          padding: selected[i].padding,
        });
      }
      const texts = session.recognize(rois, config.ocr);

      for (let i = 0; i < selected.length; i++) {
        const detection = selected[i].detection;

        hasText = hasText || texts[i].observations.length > 0;
        regions.push({
          label: detection.label,
          classIndex: detection.classIndex,
          score: detection.score,
          rect: detection.rect,
          read: texts[i].read,
          observations: texts[i].observations,
        });
      }
    }
  }

  const readFullFrame =
    config.detector === null || (config.fullFrameFallback && !hasText);

  return {
    regions,
    fullFrame: readFullFrame
      ? session.recognize([{ rect: FULL_FRAME_RECT }], config.ocr)[0]
          .observations
      : [],
    imageWidth: session.width,
    imageHeight: session.height,
  };
};

/** Подпись региона: заданная доменом, иначе имя класса модели */
const regionTitle = (
  region: IOcrScanRegion,
  titles: Record<string, string>,
): string | undefined => {
  "worklet";

  if (region.label === "") {
    return undefined;
  }

  return titles[region.label] ?? region.label;
};

/**
 * Сборка боксов оверлея кадра: регионы детектора («прицел»), кандидаты
 * домена, затем строки текста до общего лимита.
 */
export const collectOverlayBoxes = (
  frame: IOcrScanFrame,
  candidates: IOcrScanCandidate[],
  regionTitles: Record<string, string>,
  maxBoxes: number,
): IScanOverlayBox[] => {
  "worklet";

  const boxes: IScanOverlayBox[] = [];

  for (let i = 0; i < frame.regions.length && boxes.length < maxBoxes; i++) {
    boxes.push({
      rect: frame.regions[i].rect,
      kind: "region",
      label: regionTitle(frame.regions[i], regionTitles),
    });
  }
  for (let i = 0; i < candidates.length && boxes.length < maxBoxes; i++) {
    boxes.push({
      rect: candidates[i].rect,
      kind: candidates[i].isValid ? "valid" : "candidate",
      label: candidates[i].value,
    });
  }
  for (let i = 0; i < frame.regions.length && boxes.length < maxBoxes; i++) {
    const observations = frame.regions[i].observations;

    for (let j = 0; j < observations.length && boxes.length < maxBoxes; j++) {
      boxes.push({
        rect: observations[j].rect,
        kind: "text",
        label: observations[j].text,
      });
    }
  }
  for (let i = 0; i < frame.fullFrame.length && boxes.length < maxBoxes; i++) {
    boxes.push({
      rect: frame.fullFrame[i].rect,
      kind: "text",
      label: frame.fullFrame[i].text,
    });
  }

  return boxes;
};

/** Атрибуты кадра домена → слияние в накопленные (домены без атрибутов — no-op) */
export const mergeFrameAttributes = <TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  attributes: Synchronizable<TAttributes>,
  frame: IOcrScanFrame,
): void => {
  "worklet";

  const extract = domain.extractAttributes;
  const merge = domain.mergeAttributes;

  if (extract === null || merge === null) {
    return;
  }
  const frameAttributes = extract(frame);

  attributes.setBlocking(prev => merge(prev, frameAttributes));
};

/** Межкадровое накопление свидетельств кандидатов (голоса за код и т.п.) */
export const accumulateCandidateVotes = <TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  attributes: Synchronizable<TAttributes>,
  candidates: IOcrScanCandidate[],
): void => {
  "worklet";

  const accumulate = domain.accumulateCandidates;

  if (accumulate === null || candidates.length === 0) {
    return;
  }
  attributes.setBlocking(prev => accumulate(prev, candidates));
};

/**
 * Правило подтверждения домена: обновляет стрик лучшим валидным кандидатом
 * кадра, затем подтверждает серией одинаковых сканов подряд ЛИБО выводом
 * домена из накопленных свидетельств; гейт полноты атрибутов
 * (`isComplete`) — общий для обоих путей.
 */
export const resolveConfirmation = <TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  candidates: IOcrScanCandidate[],
  streak: Synchronizable<IOcrStreak>,
  attributes: Synchronizable<TAttributes>,
): IOcrScanResolved | null => {
  "worklet";

  const best =
    candidates.length > 0 && candidates[0].isValid ? candidates[0] : null;

  if (best !== null) {
    const previous = streak.getBlocking();
    const count = previous.code === best.value ? previous.count + 1 : 1;

    streak.setBlocking({ code: best.value, count });
  }

  let confirmed: IOcrScanResolved | null = null;

  if (best !== null && streak.getBlocking().count >= domain.confirmStreak) {
    confirmed = { value: best.value, confidence: best.confidence };
  } else if (domain.resolveAccumulated !== null) {
    confirmed = domain.resolveAccumulated(attributes.getBlocking());
  }
  if (confirmed === null) {
    return null;
  }

  const attributesReady =
    domain.isComplete === null || domain.isComplete(attributes.getBlocking());

  return attributesReady ? confirmed : null;
};
