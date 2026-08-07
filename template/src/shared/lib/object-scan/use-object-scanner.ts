import {
  getWorkletEngine,
  publishOverlay,
  shouldEmit,
  toUprightRect,
  useOverlayChannel,
  useStableCallback,
  useVisionFrameOutput,
} from "@shared/lib/ocr-scan";
import {
  IScanOverlayBox,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useEffect, useMemo, useState } from "react";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import type { ObjectScanOptions } from "react-native-vision-engine";
import {
  getBoxedVisionEngine,
  getVisionEngine,
} from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { IDetectedObjectInfo } from "./types";

/** Троттлинг потока детекций в JS, мс */
const DETECTIONS_INTERVAL_MS = 300;

export interface IUseObjectScannerProps {
  /** Имя модели (без расширения) в `ios/MLModels` / `android assets` */
  modelName: string;
  /** Метки классов по индексу (для TFLite, где меток в модели нет) */
  labels?: string[];
  minScore?: number;
  maxObjects?: number;
  /** Троттлящийся поток обнаруженных объектов */
  onDetections?: (objects: IDetectedObjectInfo[]) => void;
}

export interface IObjectScanner {
  frameOutput: CameraFrameOutput;
  /** Снимки боксов для оверлея (читать через getDirty) */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  /** null — модель ещё грузится; false — не найдена/несовместима */
  isModelLoaded: boolean | null;
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
}: IUseObjectScannerProps): IObjectScanner => {
  const boxedEngine = useMemo(() => getBoxedVisionEngine(), []);
  const overlay = useOverlayChannel();
  const modelReady = useMemo(() => createSynchronizable<boolean>(false), []);
  const [isModelLoaded, setModelLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    getVisionEngine()
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
  }, [modelName, modelReady]);

  const handleDetections = useStableCallback(onDetections);
  const labelsList = useMemo(() => labels ?? [], [labels]);

  const onFrame = useMemo(() => {
    const scanOptions: ObjectScanOptions = { minScore, maxObjects };
    const classLabels = labelsList;

    return (frame: Frame) => {
      "worklet";

      try {
        if (!modelReady.getDirty()) {
          return;
        }

        const engine = getWorkletEngine(boxedEngine);
        const result = engine.detectObjects(frame, scanOptions);

        const boxes: IScanOverlayBox[] = [];

        for (let i = 0; i < result.objects.length; i++) {
          const object = result.objects[i];

          boxes.push({
            rect: toUprightRect(object.rect, result.bufferOrientation),
            kind: "region",
            label:
              object.label !== ""
                ? object.label
                : (classLabels[object.classIndex] ?? `#${object.classIndex}`),
          });
        }
        publishOverlay(overlay, boxes, result.imageWidth, result.imageHeight);

        if (shouldEmit("object.detections", DETECTIONS_INTERVAL_MS)) {
          const infos: IDetectedObjectInfo[] = result.objects.map(object => ({
            classIndex: object.classIndex,
            label:
              object.label !== ""
                ? object.label
                : (classLabels[object.classIndex] ?? `#${object.classIndex}`),
            score: object.score,
          }));

          scheduleOnRN(handleDetections, infos);
        }
      } finally {
        frame.dispose();
      }
    };
  }, [
    boxedEngine,
    overlay,
    modelReady,
    minScore,
    maxObjects,
    labelsList,
    handleDetections,
  ]);

  const frameOutput = useVisionFrameOutput(onFrame);

  return { frameOutput, overlay, isModelLoaded };
};
