export { DETECTOR_DEFAULTS } from "./defaults";
export {
  createBoxedVisionEngine,
  createVisionEngine,
  getBoxedVisionEngine,
  getVisionEngine,
} from "./engine";
export type {
  AnalyzeOptions,
  AnalyzeResult,
  DetectedObject,
  ObjectScanOptions,
  ObjectScanResult,
  OcrBufferOrientation,
  OcrObservation,
  OcrRecognitionMode,
  OcrRect,
  OcrScanOptions,
  OcrScanResult,
  VisionEngine,
} from "./specs/VisionEngine.nitro";
