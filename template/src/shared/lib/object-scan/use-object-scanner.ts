import {
  getWorkletEngine,
  IScanDiagnostics,
  publishOverlay,
  shouldEmit,
  toUprightRect,
  useOverlayChannel,
  useScannerInstanceKey,
  useStableCallback,
  useVisionFrameOutput,
} from "@shared/lib/ocr-scan";
import {
  IScanOverlayBox,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import type {
  DetectedObject,
  ObjectScanOptions,
} from "react-native-vision-engine";
import {
  createBoxedVisionEngine,
  DETECTOR_DEFAULTS,
} from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { IDetectedObjectInfo } from "./types";

/** Троттлинг потока детекций в JS, мс */
const DETECTIONS_INTERVAL_MS = 300;
/** Троттлинг dev-диагностики кадра, мс */
const DIAGNOSTICS_INTERVAL_MS = 500;
/** Троттлинг сообщений об ошибках кадра, мс */
const ERROR_INTERVAL_MS = 1000;

/** Метка объекта: из модели (CoreML), из списка потребителя или "#<индекс>" */
function resolveObjectLabel(object: DetectedObject, labels: string[]): string {
  "worklet";

  if (object.label !== "") {
    return object.label;
  }

  return labels[object.classIndex] ?? `#${object.classIndex}`;
}

export interface IUseObjectScannerProps {
  /** Имя модели (без расширения) в `ios/MLModels` / `android assets` */
  modelName: string;
  /** Метки классов по индексу (для TFLite, где меток в модели нет) */
  labels?: string[];
  minScore?: number;
  maxObjects?: number;
  /** Троттлящийся поток обнаруженных объектов */
  onDetections?: (objects: IDetectedObjectInfo[]) => void;
  /** Ошибка обработки кадра (троттлится); без обработчика — console.warn */
  onError?: (message: string) => void;
}

export interface IObjectScanner {
  frameOutput: CameraFrameOutput;
  /** Снимки боксов для оверлея (читать через getDirty) */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  /** null — модель ещё грузится; false — не найдена/несовместима */
  isModelLoaded: boolean | null;
  /** Приостановить обработку кадров («нашёл → заморозь») */
  pause: () => void;
  /** Возобновить обработку кадров и очистить оверлей */
  resume: () => void;
  /** Диагностика последнего кадра; заполняется только в __DEV__ */
  diagnostics: IScanDiagnostics | null;
}

/**
 * Frame-пайплайн детекции объектов: модель гоняется на worklet-потоке
 * камеры, боксы публикуются для Skia-оверлея, поток объектов уходит
 * в JS троттлящимся колбэком. Ядро то же, что у OCR-сканера, — модель
 * кладётся в те же папки моделей приложения.
 */
export const useObjectScanner = ({
  modelName,
  labels,
  minScore = 0.4,
  maxObjects = 8,
  onDetections,
  onError,
}: IUseObjectScannerProps): IObjectScanner => {
  const instanceKey = useScannerInstanceKey("object");
  // движок per-scanner: слоты моделей не делятся с другими сканерами
  const boxedEngine = useMemo(() => createBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const modelReady = useMemo(() => createSynchronizable<boolean>(false), []);
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const [isModelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [diagnostics, setDiagnostics] = useState<IScanDiagnostics | null>(null);

  useEffect(() => {
    let cancelled = false;

    boxedEngine
      .unbox()
      .loadObjectModel(modelName)
      .then(loaded => {
        if (!cancelled) {
          setModelLoaded(loaded);
          modelReady.setBlocking(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModelLoaded(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [boxedEngine, modelName, modelReady]);

  const handleDetections = useStableCallback(onDetections);
  const handleError = useStableCallback(
    onError ?? (message => console.warn("[ObjectScan]", message)),
  );
  const labelsList = useMemo(() => labels ?? [], [labels]);

  const onFrame = useMemo(() => {
    const isDev = __DEV__;
    const scanOptions: ObjectScanOptions = {
      minScore,
      maxObjects,
      iouThreshold: DETECTOR_DEFAULTS.iouThreshold,
    };
    const classLabels = labelsList;

    return (frame: Frame) => {
      "worklet";

      try {
        if (!modelReady.getDirty() || suspended.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine, instanceKey);
        const result = engine.detectObjects(frame, scanOptions);

        if (
          isDev &&
          shouldEmit(`${instanceKey}:diag`, DIAGNOSTICS_INTERVAL_MS)
        ) {
          scheduleOnRN(setDiagnostics, {
            durationMs: result.durationMs,
            detectorUsed: true,
            resultCount: result.objects.length,
          });
        }

        const boxes: IScanOverlayBox[] = [];

        for (let i = 0; i < result.objects.length; i++) {
          const object = result.objects[i];

          boxes.push({
            rect: toUprightRect(object.rect, result.bufferOrientation),
            kind: "region",
            label: resolveObjectLabel(object, classLabels),
          });
        }
        publishOverlay(overlay, boxes, result.imageWidth, result.imageHeight);

        if (shouldEmit(`${instanceKey}:detections`, DETECTIONS_INTERVAL_MS)) {
          const infos: IDetectedObjectInfo[] = result.objects.map(object => ({
            classIndex: object.classIndex,
            label: resolveObjectLabel(object, classLabels),
            score: object.score,
          }));

          scheduleOnRN(handleDetections, infos);
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
    modelReady,
    suspended,
    minScore,
    maxObjects,
    labelsList,
    handleDetections,
    handleError,
  ]);

  const frameOutput = useVisionFrameOutput(onFrame);

  const pause = useCallback(() => {
    suspended.setBlocking(true);
  }, [suspended]);

  const resume = useCallback(() => {
    overlay.setBlocking(prev => ({
      boxes: [],
      imageWidth: prev.imageWidth,
      imageHeight: prev.imageHeight,
      revision: prev.revision + 1,
    }));
    suspended.setBlocking(false);
  }, [overlay, suspended]);

  return { frameOutput, overlay, isModelLoaded, pause, resume, diagnostics };
};
