import AVFoundation
import Foundation
import NitroModules
import VisionCamera

/// Фасад nitro-спеки `VisionEngine`: держит слоты моделей и оркеструет
/// сервисы (`VisionTextRecognizer`, `CoreMLObjectDetector`,
/// `CoreMLModelLoader`, `FrameGeometry`). Логики распознавания здесь нет.
/// Все методы обработки синхронные — вызываются с frame-потока VisionCamera.
class HybridVisionEngine: HybridVisionEngineSpec {
  /// Максимум регионов детектора, прогоняемых через OCR за кадр
  private static let maxDetectorRegions = 3
  /// Порог уверенности детектора регионов OCR
  private static let detectorMinConfidence: Float = 0.35
  /// Расширение региона детектора перед OCR, доля от размеров региона
  private static let regionPadding: CGFloat = 0.18

  /// Детектор регионов для наведения OCR (слот `loadDetector`)
  private var detector: LoadedCoreMLModel?
  /// Модель детекции объектов (слот `loadObjectModel`)
  private var objectModel: LoadedCoreMLModel?

  var isDetectorLoaded: Bool {
    return detector != nil
  }

  var isObjectModelLoaded: Bool {
    return objectModel != nil
  }

  func loadDetector(modelName: String) throws -> Promise<Bool> {
    return Promise.async {
      guard let loaded = try await CoreMLModelLoader.load(named: modelName) else {
        return false
      }
      self.detector = loaded
      return true
    }
  }

  func loadObjectModel(modelName: String) throws -> Promise<Bool> {
    return Promise.async {
      guard let loaded = try await CoreMLModelLoader.load(named: modelName) else {
        return false
      }
      self.objectModel = loaded
      return true
    }
  }

  // MARK: - Spec methods

  func scan(frame: any HybridFrameSpec, options: OcrScanOptions) throws -> OcrScanResult {
    return try runOcr(Self.unwrap(frame), options: options)
  }

  func detectObjects(frame: any HybridFrameSpec, options: ObjectScanOptions) throws -> ObjectScanResult {
    return try runObjects(Self.unwrap(frame), options: options)
  }

  func analyze(frame: any HybridFrameSpec, options: AnalyzeOptions) throws -> AnalyzeResult {
    let context = try Self.unwrap(frame)
    var ocr: OcrScanResult?
    var objects: ObjectScanResult?

    if let ocrOptions = options.ocr {
      ocr = try runOcr(context, options: ocrOptions)
    }
    if let objectOptions = options.objects {
      objects = try runObjects(context, options: objectOptions)
    }

    return AnalyzeResult(ocr: ocr, objects: objects)
  }

  // MARK: - Pipelines

  /// OCR кадра: с детектором — только по его регионам (ROI + padding),
  /// без детектора или при пустых регионах — полнокадрово
  private func runOcr(
    _ context: FrameContext,
    options: OcrScanOptions
  ) throws -> OcrScanResult {
    let start = CACurrentMediaTime()

    var regions: [RawDetection] = []
    var observations: [OcrObservation] = []
    if let detector {
      // детектор наводит OCR на регионы интереса — читаем только их
      regions = try CoreMLObjectDetector.detect(
        detector,
        pixelBuffer: context.pixelBuffer,
        orientation: context.orientation,
        minScore: Self.detectorMinConfidence
      )
      regions = Array(regions.prefix(Self.maxDetectorRegions))
      for detection in regions {
        let roi = FrameGeometry.pad(
          FrameGeometry.toVisionROI(detection.rect),
          by: Self.regionPadding
        )
        observations += try VisionTextRecognizer.recognize(
          in: context.pixelBuffer,
          orientation: context.orientation,
          regionOfInterest: roi,
          options: options
        )
      }
    }
    if observations.isEmpty {
      observations = try VisionTextRecognizer.recognize(
        in: context.pixelBuffer,
        orientation: context.orientation,
        regionOfInterest: nil,
        options: options
      )
    }

    observations = observations
      .filter { $0.confidence >= options.minConfidence }
      .sorted { $0.confidence > $1.confidence }
    let limit = max(0, Int(options.maxObservations))
    if observations.count > limit {
      observations = Array(observations.prefix(limit))
    }

    return OcrScanResult(
      observations: observations,
      regions: regions.map(Self.toDetectedObject),
      // Vision возвращает боксы уже в системе координат ориентированного
      // (выпрямленного) изображения — доворот на JS-стороне не нужен
      bufferOrientation: .up,
      imageWidth: context.uprightWidth,
      imageHeight: context.uprightHeight,
      durationMs: (CACurrentMediaTime() - start) * 1000,
      detectorUsed: detector != nil
    )
  }

  /// Детекция объектов кадра моделью из слота `objectModel`
  private func runObjects(
    _ context: FrameContext,
    options: ObjectScanOptions
  ) throws -> ObjectScanResult {
    let start = CACurrentMediaTime()
    guard let objectModel else {
      throw RuntimeError.error(withMessage: "VisionEngine: object model is not loaded — call loadObjectModel() first")
    }

    var detections = try CoreMLObjectDetector.detect(
      objectModel,
      pixelBuffer: context.pixelBuffer,
      orientation: context.orientation,
      minScore: Float(options.minScore)
    )
    let limit = max(0, Int(options.maxObjects))
    if detections.count > limit {
      detections = Array(detections.prefix(limit))
    }

    return ObjectScanResult(
      objects: detections.map(Self.toDetectedObject),
      bufferOrientation: .up,
      imageWidth: context.uprightWidth,
      imageHeight: context.uprightHeight,
      durationMs: (CACurrentMediaTime() - start) * 1000
    )
  }

  // MARK: - Frame plumbing

  /// Распакованный кадр: pixel buffer, EXIF-ориентация для Vision и
  /// размеры выпрямленного изображения. Общий для всех конвейеров вызова.
  private struct FrameContext {
    let pixelBuffer: CVPixelBuffer
    let orientation: CGImagePropertyOrientation
    let uprightWidth: Double
    let uprightHeight: Double
  }

  /// Frame VisionCamera → контекст обработки; бросает, если кадр освобождён
  private static func unwrap(_ frame: any HybridFrameSpec) throws -> FrameContext {
    guard let nativeFrame = frame as? NativeFrame,
          let pixelBuffer = nativeFrame.sampleBuffer?.imageBuffer else {
      throw RuntimeError.error(withMessage: "VisionEngine: Frame has no pixel buffer — is it already disposed?")
    }

    let orientation = FrameGeometry.cgOrientation(
      frame.orientation,
      isMirrored: frame.isMirrored
    )
    let bufferWidth = CVPixelBufferGetWidth(pixelBuffer)
    let bufferHeight = CVPixelBufferGetHeight(pixelBuffer)
    let isRotated = orientation.swapsDimensions

    return FrameContext(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      uprightWidth: Double(isRotated ? bufferHeight : bufferWidth),
      uprightHeight: Double(isRotated ? bufferWidth : bufferHeight)
    )
  }

  /// Внутренняя детекция → `DetectedObject` контракта спеки
  private static func toDetectedObject(_ detection: RawDetection) -> DetectedObject {
    return DetectedObject(
      classIndex: Double(detection.classIndex),
      label: detection.label,
      score: Double(detection.score),
      rect: OcrRect(
        x: detection.rect.minX,
        y: detection.rect.minY,
        width: detection.rect.width,
        height: detection.rect.height
      )
    )
  }
}
