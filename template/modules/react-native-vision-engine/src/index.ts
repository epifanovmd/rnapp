export { VISION_ENGINE_DEFAULTS } from "./defaults";
export {
  createBoxedVisionEngine,
  createVisionEngine,
  getBoxedVisionEngine,
  getVisionEngine,
} from "./engine";
export type {
  DetectedObject,
  DetectOptions,
  DetectorAccelerator,
  DetectorBoxUnits,
  DetectorModelConfig,
  DetectorModelInfo,
  DetectorResizeMode,
  FrameSession,
  OcrObservation,
  OcrOptions,
  OcrRecognitionMode,
  OcrRect,
  OcrRoi,
  OcrRoiResult,
  VisionEngine,
} from "./specs/VisionEngine.nitro";
