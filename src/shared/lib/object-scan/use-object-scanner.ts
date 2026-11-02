import {
  getWorkletEngine,
  IScanDiagnostics,
  publishOverlay,
  resolveModelConfig,
  shouldEmit,
  useOverlayChannel,
  usePreviewOrientation,
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
  DetectOptions,
  DetectorModelConfig,
  DetectorModelInfo,
} from "react-native-vision-engine";
import {
  createBoxedVisionEngine,
  VISION_ENGINE_DEFAULTS,
} from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { selectObjects } from "./select-objects";
import { IDetectedObjectInfo } from "./types";

/** Троттлинг потока детекций в JS, мс */
const DETECTIONS_INTERVAL_MS = 300;
/** Троттлинг dev-диагностики кадра, мс */
const DIAGNOSTICS_INTERVAL_MS = 500;
/** Троттлинг сообщений об ошибках кадра, мс */
const ERROR_INTERVAL_MS = 1000;

/** Подписи классов по умолчанию — имена классов модели как есть */
const NO_TITLES: Record<string, string> = {};

/** Подпись объекта: заданная потребителем, имя класса модели или "#<индекс>" */
const resolveObjectTitle = (
  object: DetectedObject,
  titles: Record<string, string>,
): string => {
  "worklet";

  if (object.label === "") {
    return `#${object.classIndex}`;
  }

  return titles[object.label] ?? object.label;
};

export interface IUseObjectScannerProps {
  /** Модель детекции и способ её прогона (фиксируется по значению) */
  model: DetectorModelConfig;
  /** Подписи классов по имени класса модели */
  titles?: Record<string, string>;
  /** Имена классов, которые показывать; не задано — все */
  classes?: string[];
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
  /** Описание загруженной модели; null — ещё грузится или не найдена */
  modelInfo: DetectorModelInfo | null;
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
 * кладётся в те же папки моделей приложения, классы берутся из её метаданных.
 */
export const useObjectScanner = ({
  model,
  titles = NO_TITLES,
  classes,
  minScore = 0.4,
  maxObjects = 8,
  onDetections,
  onError,
}: IUseObjectScannerProps): IObjectScanner => {
  const instanceKey = useScannerInstanceKey("object");
  // движок per-scanner: реестр моделей не делится с другими сканерами
  const boxedEngine = useMemo(() => createBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const previewOrientation = usePreviewOrientation();
  const modelReady = useMemo(() => createSynchronizable<boolean>(false), []);
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const [isModelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [modelInfo, setModelInfo] = useState<DetectorModelInfo | null>(null);
  const [diagnostics, setDiagnostics] = useState<IScanDiagnostics | null>(null);

  // конфиг сравнивается по значению: литерал у потребителя не перезагружает модель
  const modelKey = JSON.stringify(model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modelConfig = useMemo(() => resolveModelConfig(model), [modelKey]);

  useEffect(() => {
    let cancelled = false;

    boxedEngine
      .unbox()
      .loadModel(modelConfig)
      .then((info: DetectorModelInfo) => {
        if (!cancelled) {
          setModelLoaded(info.loaded);
          setModelInfo(info.loaded ? info : null);
          modelReady.setBlocking(info.loaded);
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
  }, [boxedEngine, modelConfig, modelReady]);

  const handleDetections = useStableCallback(onDetections);
  const handleError = useStableCallback(
    onError ?? (message => console.warn("[ObjectScan]", message)),
  );
  const classesKey = classes?.join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const classList = useMemo(() => classes, [classesKey]);

  const onFrame = useMemo(() => {
    const isDev = __DEV__;
    const modelName = modelConfig.name;
    const detectOptions: DetectOptions = {
      minScore,
      iouThreshold: VISION_ENGINE_DEFAULTS.iouThreshold,
    };

    return (frame: Frame) => {
      "worklet";

      try {
        if (!modelReady.getDirty() || suspended.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine, instanceKey);
        const startedAt = Date.now();
        const session = engine.openFrame(frame);
        let objects: DetectedObject[];
        const imageWidth = session.width;
        const imageHeight = session.height;

        try {
          objects = selectObjects(
            session.detect(modelName, detectOptions),
            classList,
            maxObjects,
          );
        } finally {
          session.dispose();
        }

        if (
          isDev &&
          shouldEmit(`${instanceKey}:diag`, DIAGNOSTICS_INTERVAL_MS)
        ) {
          scheduleOnRN(setDiagnostics, {
            durationMs: Date.now() - startedAt,
            detectorUsed: true,
            resultCount: objects.length,
            // детекция объектов регионы под OCR не читает
            regionCount: 0,
          });
        }

        const boxes: IScanOverlayBox[] = [];

        for (let i = 0; i < objects.length; i++) {
          boxes.push({
            rect: objects[i].rect,
            kind: "region",
            label: resolveObjectTitle(objects[i], titles),
          });
        }
        publishOverlay(
          overlay,
          boxes,
          imageWidth,
          imageHeight,
          previewOrientation.getDirty(),
        );

        if (shouldEmit(`${instanceKey}:detections`, DETECTIONS_INTERVAL_MS)) {
          const infos: IDetectedObjectInfo[] = objects.map(object => ({
            classIndex: object.classIndex,
            className: object.label,
            label: resolveObjectTitle(object, titles),
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
    previewOrientation,
    modelReady,
    suspended,
    modelConfig,
    minScore,
    maxObjects,
    classList,
    titles,
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

  return {
    frameOutput,
    overlay,
    isModelLoaded,
    modelInfo,
    pause,
    resume,
    diagnostics,
  };
};
