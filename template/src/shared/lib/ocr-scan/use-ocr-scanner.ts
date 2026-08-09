import {
  EMPTY_SCAN_OVERLAY,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import type {
  OcrRecognitionMode,
  OcrScanOptions,
} from "react-native-vision-engine";
import {
  createBoxedVisionEngine,
  DETECTOR_DEFAULTS,
} from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import {
  accumulateCandidateVotes,
  collectOverlayBoxes,
  IOcrStreak,
  mergeFrameAttributes,
  resolveConfirmation,
  toUprightObservations,
} from "./ocr-worklets";
import { IOcrScanDomain, IOcrScanObservation, IScanDiagnostics } from "./types";
import {
  getWorkletEngine,
  publishOverlay,
  shouldEmit,
  useOverlayChannel,
  useScannerInstanceKey,
  useStableCallback,
  useVisionFrameOutput,
} from "./use-frame-pipeline";

/** Период дебаг-лога сырых OCR-текстов (__DEV__), мс */
const TEXTS_LOG_INTERVAL_MS = 3000;
/** Троттлинг потока наблюдений в JS (onObservations), мс */
const OBSERVATIONS_INTERVAL_MS = 400;
/** Троттлинг dev-диагностики кадра, мс */
const DIAGNOSTICS_INTERVAL_MS = 500;
/** Троттлинг сообщений об ошибках кадра, мс */
const ERROR_INTERVAL_MS = 1000;

/** Диагностика OCR — выполняется на RN-потоке */
function logDiagnostics(message: string): void {
  console.log(message);
}

export interface IUseOcrScannerProps<TAttributes> {
  /** Домен распознавания: извлечение кандидатов, стабилизация, детектор */
  domain: IOcrScanDomain<TAttributes>;
  /** Режим нативного OCR (iOS): fast — быстрее, accurate — точнее */
  mode?: OcrRecognitionMode;
  /** Читать полный кадр, когда кропы детектора не дали текста (по умолчанию нет) */
  fullFrameFallback?: boolean;
  /** Стабилизированное значение подтверждено */
  onCandidateConfirmed?: (
    value: string,
    confidence: number,
    attributes: TAttributes,
  ) => void;
  /** Поток OCR-областей (троттлится) — для «сырых» сценариев */
  onObservations?: (observations: IOcrScanObservation[]) => void;
  /** Ошибка обработки кадра (троттлится); без обработчика — console.warn */
  onError?: (message: string) => void;
}

export interface IOcrScanner {
  frameOutput: CameraFrameOutput;
  /** Снимки распознавания для оверлея (читать через getDirty) */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  /** Сбросить стабилизацию и возобновить сканирование */
  resume: () => void;
  /** Диагностика последнего кадра; заполняется только в __DEV__ */
  diagnostics: IScanDiagnostics | null;
}

/**
 * Универсальный frame-пайплайн сканера: нативный OCR на worklet-потоке
 * камеры, доменное извлечение кандидатов, стабилизация серией одинаковых
 * результатов, накопление доменных атрибутов и публикация областей для
 * оверлея. Домен задаёт `IOcrScanDomain`, покадровые шаги — worklet-хелперы
 * `ocr-worklets`.
 */
export const useOcrScanner = <TAttributes>({
  domain,
  mode = "accurate",
  fullFrameFallback = false,
  onCandidateConfirmed,
  onObservations,
  onError,
}: IUseOcrScannerProps<TAttributes>): IOcrScanner => {
  const instanceKey = useScannerInstanceKey("ocr");
  // движок per-scanner: слоты моделей не делятся с другими сканерами
  const boxedEngine = useMemo(() => createBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const streak = useMemo(
    () => createSynchronizable<IOcrStreak>({ code: "", count: 0 }),
    [],
  );
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const attributes = useMemo(
    () => createSynchronizable<TAttributes>(domain.emptyAttributes),
    // домен фиксируется на маунт
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [diagnostics, setDiagnostics] = useState<IScanDiagnostics | null>(null);

  useEffect(() => {
    const modelName = domain.detectorModelName;

    if (modelName !== null) {
      // детектор опционален: без обученной модели работает полнокадровый OCR
      boxedEngine
        .unbox()
        .loadDetector(modelName)
        .then(loaded => {
          if (!loaded) {
            console.warn(
              `[OcrScan] детектор «${modelName}» не найден в бандле/assets — ` +
                "OCR работает полнокадрово",
            );
          }
        })
        .catch(error => console.warn("[OcrScan] loadDetector:", error));
    }
  }, [boxedEngine, domain.detectorModelName]);

  const handleConfirmed = useStableCallback(onCandidateConfirmed);
  const handleObservations = useStableCallback(onObservations);
  const handleError = useStableCallback(
    onError ?? (message => console.warn("[OcrScan]", message)),
  );
  const hasObservationsListener = onObservations !== undefined;

  const onFrame = useMemo(() => {
    const isDev = __DEV__;
    const scanOptions: OcrScanOptions = {
      mode,
      minConfidence: 0.25,
      maxObservations: 12,
      fullFrameFallback,
      regionMinScore: DETECTOR_DEFAULTS.regionMinScore,
      maxRegions: DETECTOR_DEFAULTS.maxRegions,
      regionPadding: DETECTOR_DEFAULTS.regionPadding,
      regionIouThreshold: DETECTOR_DEFAULTS.iouThreshold,
    };

    return (frame: Frame) => {
      "worklet";

      try {
        if (suspended.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine, instanceKey);
        const result = engine.scan(frame, scanOptions);
        const observations = toUprightObservations(result);

        if (
          isDev &&
          shouldEmit(`${instanceKey}:diag`, DIAGNOSTICS_INTERVAL_MS)
        ) {
          scheduleOnRN(setDiagnostics, {
            durationMs: result.durationMs,
            detectorUsed: result.detectorUsed,
            resultCount: observations.length,
          });
        }
        if (
          isDev &&
          observations.length > 0 &&
          shouldEmit(`${instanceKey}:texts`, TEXTS_LOG_INTERVAL_MS)
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
          shouldEmit(`${instanceKey}:observations`, OBSERVATIONS_INTERVAL_MS)
        ) {
          scheduleOnRN(handleObservations, observations);
        }

        mergeFrameAttributes(domain, attributes, observations);
        const candidates = domain.extractCandidates(observations);

        publishOverlay(
          overlay,
          collectOverlayBoxes(result, observations, candidates),
          result.imageWidth,
          result.imageHeight,
        );
        accumulateCandidateVotes(domain, attributes, candidates);

        const confirmed = resolveConfirmation(
          domain,
          candidates,
          streak,
          attributes,
        );

        if (confirmed !== null) {
          suspended.setBlocking(true);
          streak.setBlocking({ code: "", count: 0 });
          publishOverlay(overlay, [], result.imageWidth, result.imageHeight);
          scheduleOnRN(
            handleConfirmed,
            confirmed.value,
            confirmed.confidence,
            attributes.getBlocking(),
          );
        }
      } catch (error) {
        if (shouldEmit(`${instanceKey}:error`, ERROR_INTERVAL_MS)) {
          scheduleOnRN(
            handleError,
            error instanceof Error ? error.message : String(error),
          );
        }
      } finally {
        frame.dispose();
      }
    };
  }, [
    instanceKey,
    boxedEngine,
    overlay,
    streak,
    suspended,
    attributes,
    domain,
    mode,
    fullFrameFallback,
    handleConfirmed,
    handleObservations,
    handleError,
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

  return { frameOutput, overlay, resume, diagnostics };
};
