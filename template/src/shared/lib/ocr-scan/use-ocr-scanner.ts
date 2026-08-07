import {
  EMPTY_SCAN_OVERLAY,
  IScanOverlayBox,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useCallback, useEffect, useMemo } from "react";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import type {
  OcrRecognitionMode,
  OcrScanOptions,
} from "react-native-vision-engine";
import {
  getBoxedVisionEngine,
  getVisionEngine,
} from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { toUprightRect } from "./orientation";
import { IOcrScanDomain, IOcrScanObservation } from "./types";
import {
  getWorkletEngine,
  publishOverlay,
  shouldEmit,
  useOverlayChannel,
  useStableCallback,
  useVisionFrameOutput,
} from "./use-frame-pipeline";

/** Максимум боксов в снимке оверлея; регионы и кандидаты идут раньше текста */
const MAX_OVERLAY_BOXES = 10;
/** Период дебаг-лога сырых OCR-текстов, мс */
const TEXTS_LOG_INTERVAL_MS = 3000;
/** Троттлинг потока наблюдений в JS (onObservations), мс */
const OBSERVATIONS_INTERVAL_MS = 400;

interface IStreak {
  code: string;
  count: number;
}

/** Диагностика OCR — выполняется на RN-потоке */
function logDiagnostics(message: string): void {
  console.log(message);
}

export interface IUseOcrScannerProps<TAttributes> {
  /** Домен распознавания: извлечение кандидатов, стабилизация, детектор */
  domain: IOcrScanDomain<TAttributes>;
  /** Режим нативного OCR (iOS): fast — быстрее, accurate — точнее */
  mode?: OcrRecognitionMode;
  /** Стабилизированное значение подтверждено */
  onCandidateConfirmed?: (
    value: string,
    confidence: number,
    attributes: TAttributes,
  ) => void;
  /** Поток OCR-областей (троттлится) — для «сырых» сценариев */
  onObservations?: (observations: IOcrScanObservation[]) => void;
}

export interface IOcrScanner {
  frameOutput: CameraFrameOutput;
  /** Снимки распознавания для оверлея (читать через getDirty) */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  /** Сбросить стабилизацию и возобновить сканирование */
  resume: () => void;
}

/**
 * Универсальный frame-пайплайн сканера: нативный OCR на worklet-потоке
 * камеры, доменное извлечение кандидатов, стабилизация серией одинаковых
 * результатов, накопление доменных атрибутов и публикация областей для
 * оверлея. Домен задаёт `IOcrScanDomain`.
 */
export const useOcrScanner = <TAttributes>({
  domain,
  mode = "accurate",
  onCandidateConfirmed,
  onObservations,
}: IUseOcrScannerProps<TAttributes>): IOcrScanner => {
  const boxedEngine = useMemo(() => getBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const streak = useMemo(
    () => createSynchronizable<IStreak>({ code: "", count: 0 }),
    [],
  );
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const attributes = useMemo(
    () => createSynchronizable<TAttributes>(domain.emptyAttributes),
    // домен фиксируется на маунт
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (domain.detectorModelName !== null) {
      // детектор опционален: без обученной модели работает полнокадровый OCR
      getVisionEngine()
        .loadDetector(domain.detectorModelName)
        .catch(() => false);
    }
  }, [domain.detectorModelName]);

  const handleConfirmed = useStableCallback(onCandidateConfirmed);
  const handleObservations = useStableCallback(onObservations);
  const hasObservationsListener = onObservations !== undefined;

  const onFrame = useMemo(() => {
    const scanOptions: OcrScanOptions = {
      mode,
      minConfidence: 0.25,
      maxObservations: 12,
    };

    return (frame: Frame) => {
      "worklet";

      try {
        if (suspended.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine);
        const result = engine.scan(frame, scanOptions);

        // rect'ы приходят в координатах буфера — выпрямляем по ориентации
        const observations: IOcrScanObservation[] = result.observations.map(
          observation => ({
            text: observation.text,
            confidence: observation.confidence,
            fromDetector: observation.fromDetector,
            rect: toUprightRect(observation.rect, result.bufferOrientation),
          }),
        );

        if (
          observations.length > 0 &&
          shouldEmit("ocr.texts", TEXTS_LOG_INTERVAL_MS)
        ) {
          let texts = "";

          for (let i = 0; i < Math.min(observations.length, 8); i++) {
            texts += (i > 0 ? " | " : "") + observations[i].text;
          }
          scheduleOnRN(
            logDiagnostics,
            `[OcrScan] orientation=${result.bufferOrientation} ` +
              `image=${result.imageWidth}x${result.imageHeight} texts: ${texts}`,
          );
        }

        if (
          hasObservationsListener &&
          shouldEmit("ocr.observations", OBSERVATIONS_INTERVAL_MS)
        ) {
          scheduleOnRN(handleObservations, observations);
        }

        if (
          domain.extractAttributes !== null &&
          domain.mergeAttributes !== null
        ) {
          const frameAttributes = domain.extractAttributes(observations);
          const merge = domain.mergeAttributes;

          attributes.setBlocking(prev => merge(prev, frameAttributes));
        }

        const candidates = domain.extractCandidates(observations);
        const boxes: IScanOverlayBox[] = [];

        // регионы детектора — «прицел» вокруг зоны кода/номера
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
        publishOverlay(overlay, boxes, result.imageWidth, result.imageHeight);

        // межкадровое накопление свидетельств кандидатов (голоса за код и т.п.)
        if (domain.accumulateCandidates !== null && candidates.length > 0) {
          const accumulate = domain.accumulateCandidates;

          attributes.setBlocking(prev => accumulate(prev, candidates));
        }

        const best =
          candidates.length > 0 && candidates[0].isValid ? candidates[0] : null;

        if (best !== null) {
          const previous = streak.getBlocking();
          const count = previous.code === best.value ? previous.count + 1 : 1;

          streak.setBlocking({ code: best.value, count });
        }

        // подтверждение: серия одинаковых сканов подряд ЛИБО вывод домена
        // из накопленных свидетельств; гейт полноты атрибутов — общий
        let confirmedValue: string | null = null;
        let confirmedConfidence = 0;

        if (
          best !== null &&
          streak.getBlocking().count >= domain.confirmStreak
        ) {
          confirmedValue = best.value;
          confirmedConfidence = best.confidence;
        } else if (domain.resolveAccumulated !== null) {
          const resolved = domain.resolveAccumulated(attributes.getBlocking());

          if (resolved !== null) {
            confirmedValue = resolved.value;
            confirmedConfidence = resolved.confidence;
          }
        }

        const attributesReady =
          domain.isComplete === null ||
          domain.isComplete(attributes.getBlocking());

        if (confirmedValue !== null && attributesReady) {
          suspended.setBlocking(true);
          streak.setBlocking({ code: "", count: 0 });
          publishOverlay(overlay, [], result.imageWidth, result.imageHeight);
          scheduleOnRN(
            handleConfirmed,
            confirmedValue,
            confirmedConfidence,
            attributes.getBlocking(),
          );
        }
      } finally {
        frame.dispose();
      }
    };
  }, [
    boxedEngine,
    overlay,
    streak,
    suspended,
    attributes,
    domain,
    mode,
    handleConfirmed,
    handleObservations,
    hasObservationsListener,
  ]);

  const frameOutput = useVisionFrameOutput(onFrame);

  const resume = useCallback(() => {
    streak.setBlocking({ code: "", count: 0 });
    attributes.setBlocking(domain.emptyAttributes);
    overlay.setBlocking(prev => ({
      ...EMPTY_SCAN_OVERLAY,
      revision: prev.revision + 1,
    }));
    suspended.setBlocking(false);
  }, [attributes, domain.emptyAttributes, overlay, streak, suspended]);

  return { frameOutput, overlay, resume };
};
