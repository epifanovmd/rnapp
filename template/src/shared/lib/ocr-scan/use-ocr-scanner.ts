import {
  EMPTY_SCAN_OVERLAY,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import type {
  DetectorModelInfo,
  OcrRecognitionMode,
} from "react-native-vision-engine";
import { createBoxedVisionEngine } from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { frameObservations } from "./frame";
import {
  accumulateCandidateVotes,
  collectOverlayBoxes,
  IOcrStreak,
  mergeFrameAttributes,
  resolveConfirmation,
  runOcrPipeline,
} from "./ocr-worklets";
import {
  buildOcrPipelineConfig,
  buildRegionTitles,
  findMissingRegions,
  IOcrPipelineConfig,
  resolveModelConfig,
} from "./pipeline-config";
import {
  IOcrScanDomain,
  IOcrScanFrame,
  IOcrScanObservation,
  IScanDiagnostics,
} from "./types";
import {
  getWorkletEngine,
  publishOverlay,
  shouldEmit,
  useOverlayChannel,
  usePreviewOrientation,
  useScannerInstanceKey,
  useStableCallback,
  useVisionFrameOutput,
} from "./use-frame-pipeline";

/** Троттлинг потока наблюдений в JS (onObservations), мс */
const OBSERVATIONS_INTERVAL_MS = 400;
/** Троттлинг dev-диагностики кадра, мс */
const DIAGNOSTICS_INTERVAL_MS = 500;
/** Троттлинг сообщений об ошибках кадра, мс */
const ERROR_INTERVAL_MS = 1000;

export interface IUseOcrScannerProps<TAttributes> {
  /** Домен распознавания: извлечение кандидатов, стабилизация, детектор */
  domain: IOcrScanDomain<TAttributes>;
  /** Режим нативного OCR (iOS); перекрывает `domain.recognition.mode` */
  mode?: OcrRecognitionMode;
  /**
   * Читать полный кадр, когда кропы детектора не дали текста; перекрывает
   * `domain.recognition.fullFrameFallback`
   */
  fullFrameFallback?: boolean;
  /**
   * Имена регионов, читаемых OCR; сужает `domain.detector.regions`.
   * Меняется на лету — например, «только номер» против всех регионов домена.
   */
  regions?: string[];
  /** Стабилизированное значение подтверждено */
  onCandidateConfirmed?: (
    value: string,
    confidence: number,
    attributes: TAttributes,
  ) => void;
  /** Поток строк текста кадра (троттлится) — для «сырых» сценариев */
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
  /** Описание загруженного детектора; null — детектора нет или он ещё грузится */
  detectorInfo: DetectorModelInfo | null;
}

/**
 * Универсальный frame-пайплайн сканера: OCR-конвейер над сессией кадра на
 * worklet-потоке камеры (`runOcrPipeline`), доменное извлечение
 * кандидатов, стабилизация серией одинаковых результатов, накопление
 * доменных атрибутов и публикация регионов и текста для оверлея. Домен
 * задаёт `IOcrScanDomain`, покадровые шаги — worklet-хелперы `ocr-worklets`.
 */
export const useOcrScanner = <TAttributes>({
  domain,
  mode,
  fullFrameFallback,
  regions,
  onCandidateConfirmed,
  onObservations,
  onError,
}: IUseOcrScannerProps<TAttributes>): IOcrScanner => {
  const instanceKey = useScannerInstanceKey("ocr");
  // движок per-scanner: реестр моделей не делится с другими сканерами
  const boxedEngine = useMemo(() => createBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const previewOrientation = usePreviewOrientation();
  const streak = useMemo(
    () => createSynchronizable<IOcrStreak>({ code: "", count: 0 }),
    [],
  );
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const confirmationDelivered = useMemo(
    () => createSynchronizable<boolean>(false),
    [],
  );
  const attributes = useMemo(
    () => createSynchronizable<TAttributes>(domain.emptyAttributes),
    // домен фиксируется на маунт
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [diagnostics, setDiagnostics] = useState<IScanDiagnostics | null>(null);

  const [detectorInfo, setDetectorInfo] = useState<DetectorModelInfo | null>(
    null,
  );
  const detector = domain.detector;

  useEffect(() => {
    if (detector === null) {
      return;
    }
    let cancelled = false;

    // детектор опционален: без модели работает полнокадровый OCR
    boxedEngine
      .unbox()
      .loadModel(resolveModelConfig(detector.model))
      .then((info: DetectorModelInfo) => {
        if (cancelled) {
          return;
        }
        if (!info.loaded) {
          console.warn(
            `[OcrScan] детектор «${detector.model.name}» не найден в бандле/assets — ` +
              "OCR работает полнокадрово",
          );

          return;
        }
        const missing = findMissingRegions(detector, info);

        if (missing.length > 0) {
          console.warn(
            `[OcrScan] в модели «${detector.model.name}» нет классов: ${missing.join(", ")}`,
          );
        }
        setDetectorInfo(info);
      })
      .catch((error: unknown) => console.warn("[OcrScan] loadModel:", error));

    return () => {
      cancelled = true;
    };
  }, [boxedEngine, detector]);

  const handleConfirmed = useStableCallback(onCandidateConfirmed);
  const handleObservations = useStableCallback(onObservations);
  const handleError = useStableCallback(
    onError ?? (message => console.warn("[OcrScan]", message)),
  );
  const hasObservationsListener = onObservations !== undefined;

  // детектор входит в конвейер только загруженным — до этого читается полный кадр
  const pipelineConfig = useMemo<IOcrPipelineConfig>(
    () =>
      buildOcrPipelineConfig(
        detectorInfo === null ? null : domain.detector,
        domain.recognition,
        { mode, fullFrameFallback, regions },
      ),
    [domain, detectorInfo, mode, fullFrameFallback, regions],
  );

  // конфиг читается с потока камеры: смена режима из JS не пересоздаёт
  // frame-output (нативный output нельзя переносить между сессиями)
  const config = useMemo(
    () => createSynchronizable<IOcrPipelineConfig>(pipelineConfig),
    // начальное значение; дальше обновляется эффектом ниже
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    config.setBlocking(pipelineConfig);
  }, [config, pipelineConfig]);

  const onFrame = useMemo(() => {
    const isDev = __DEV__;
    const regionTitles = buildRegionTitles(domain.detector);

    return (frame: Frame) => {
      "worklet";

      try {
        if (suspended.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine, instanceKey);
        const frameConfig = config.getDirty();
        const startedAt = Date.now();
        const session = engine.openFrame(frame);
        let result: IOcrScanFrame;

        try {
          result = runOcrPipeline(session, frameConfig);
        } finally {
          session.dispose();
        }
        const overlayOrientation = previewOrientation.getDirty();

        if (
          isDev &&
          shouldEmit(`${instanceKey}:diag`, DIAGNOSTICS_INTERVAL_MS)
        ) {
          scheduleOnRN(setDiagnostics, {
            durationMs: Date.now() - startedAt,
            detectorUsed: frameConfig.detector !== null,
            resultCount: frameObservations(result).length,
            regionCount: result.regions.length,
          });
        }
        if (
          hasObservationsListener &&
          shouldEmit(`${instanceKey}:observations`, OBSERVATIONS_INTERVAL_MS)
        ) {
          scheduleOnRN(handleObservations, frameObservations(result));
        }

        mergeFrameAttributes(domain, attributes, result);
        const candidates = domain.extractCandidates(result);

        publishOverlay(
          overlay,
          collectOverlayBoxes(
            result,
            candidates,
            regionTitles,
            domain.maxOverlayBoxes,
          ),
          result.imageWidth,
          result.imageHeight,
          overlayOrientation,
        );
        accumulateCandidateVotes(domain, attributes, candidates);

        const confirmed = resolveConfirmation(
          domain,
          candidates,
          streak,
          attributes,
        );

        if (confirmed !== null && !confirmationDelivered.getDirty()) {
          confirmationDelivered.setBlocking(true);
          streak.setBlocking({ code: "", count: 0 });

          if (domain.suspendOnConfirm) {
            suspended.setBlocking(true);
            publishOverlay(
              overlay,
              [],
              result.imageWidth,
              result.imageHeight,
              overlayOrientation,
            );
          }

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
    previewOrientation,
    streak,
    suspended,
    confirmationDelivered,
    attributes,
    domain,
    config,
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
    confirmationDelivered.setBlocking(false);
    suspended.setBlocking(false);
  }, [
    attributes,
    confirmationDelivered,
    domain.emptyAttributes,
    overlay,
    streak,
    suspended,
  ]);

  return { frameOutput, overlay, resume, diagnostics, detectorInfo };
};
