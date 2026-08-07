import type { BoxedHybridObject } from "react-native-nitro-modules";
import { NitroModules } from "react-native-nitro-modules";

import type { OcrEngine } from "./specs/OcrEngine.nitro";

export type {
  OcrBufferOrientation,
  OcrEngine,
  OcrObservation,
  OcrRecognitionMode,
  OcrRect,
  OcrScanOptions,
  OcrScanResult,
} from "./specs/OcrEngine.nitro";

let instance: OcrEngine | undefined;

/** Единственный экземпляр нативного OCR-движка (ленивая инициализация) */
export function getOcrEngine(): OcrEngine {
  if (instance == null) {
    instance = NitroModules.createHybridObject<OcrEngine>("OcrEngine");
  }

  return instance;
}

/**
 * Обёртка для использования в worklet-рантайме VisionCamera:
 * hybrid-объект пробрасывается в другой рантайм только в boxed-виде.
 */
export function getBoxedOcrEngine(): BoxedHybridObject<OcrEngine> {
  return NitroModules.box(getOcrEngine());
}
