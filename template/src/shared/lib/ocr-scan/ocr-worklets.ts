import { IScanOverlayBox } from "@shared/lib/scan-overlay";
import type { OcrScanResult } from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";

import { toUprightRect } from "./orientation";
import {
  IOcrScanCandidate,
  IOcrScanDomain,
  IOcrScanObservation,
  IOcrScanResolved,
} from "./types";

/** Максимум боксов в снимке оверлея; регионы и кандидаты идут раньше текста */
const MAX_OVERLAY_BOXES = 10;

/** Серия одинаковых валидных кандидатов подряд */
export interface IOcrStreak {
  code: string;
  count: number;
}

/** Области результата → контракт JS-слоя (выпрямление по ориентации буфера) */
export function toUprightObservations(
  result: OcrScanResult,
): IOcrScanObservation[] {
  "worklet";

  return result.observations.map(observation => ({
    text: observation.text,
    confidence: observation.confidence,
    fromDetector: observation.fromDetector,
    rect: toUprightRect(observation.rect, result.bufferOrientation),
  }));
}

/**
 * Сборка боксов оверлея кадра: регионы детектора («прицел»), кандидаты
 * домена, затем сырые OCR-области до общего лимита.
 */
export function collectOverlayBoxes(
  result: OcrScanResult,
  observations: IOcrScanObservation[],
  candidates: IOcrScanCandidate[],
): IScanOverlayBox[] {
  "worklet";

  const boxes: IScanOverlayBox[] = [];

  for (let i = 0; i < result.regions.length; i++) {
    const region = result.regions[i];

    boxes.push({
      rect: toUprightRect(region.rect, result.bufferOrientation),
      kind: "region",
      label: region.label !== "" ? region.label : undefined,
    });
  }
  for (let i = 0; i < candidates.length; i++) {
    boxes.push({
      rect: candidates[i].rect,
      kind: candidates[i].isValid ? "valid" : "candidate",
      label: candidates[i].value,
    });
  }
  for (
    let i = 0;
    i < observations.length && boxes.length < MAX_OVERLAY_BOXES;
    i++
  ) {
    boxes.push({
      rect: observations[i].rect,
      kind: "text",
      label: observations[i].text,
    });
  }

  return boxes;
}

/** Атрибуты кадра домена → слияние в накопленные (домены без атрибутов — no-op) */
export function mergeFrameAttributes<TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  attributes: Synchronizable<TAttributes>,
  observations: IOcrScanObservation[],
): void {
  "worklet";

  const extract = domain.extractAttributes;
  const merge = domain.mergeAttributes;

  if (extract === null || merge === null) {
    return;
  }
  const frameAttributes = extract(observations);

  attributes.setBlocking(prev => merge(prev, frameAttributes));
}

/** Межкадровое накопление свидетельств кандидатов (голоса за код и т.п.) */
export function accumulateCandidateVotes<TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  attributes: Synchronizable<TAttributes>,
  candidates: IOcrScanCandidate[],
): void {
  "worklet";

  const accumulate = domain.accumulateCandidates;

  if (accumulate === null || candidates.length === 0) {
    return;
  }
  attributes.setBlocking(prev => accumulate(prev, candidates));
}

/**
 * Правило подтверждения домена: обновляет стрик лучшим валидным кандидатом
 * кадра, затем подтверждает серией одинаковых сканов подряд ЛИБО выводом
 * домена из накопленных свидетельств; гейт полноты атрибутов
 * (`isComplete`) — общий для обоих путей.
 */
export function resolveConfirmation<TAttributes>(
  domain: IOcrScanDomain<TAttributes>,
  candidates: IOcrScanCandidate[],
  streak: Synchronizable<IOcrStreak>,
  attributes: Synchronizable<TAttributes>,
): IOcrScanResolved | null {
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
}
