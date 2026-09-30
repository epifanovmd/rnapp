import CoreVideo
import Foundation
import NitroModules

/// Сессия распознавания одного кадра: детекция загруженными моделями и
/// OCR областей над одним pixel buffer'ом. Держит буфер кадра до
/// `dispose()` — JS освобождает сессию раньше самого кадра.
/// Вызовы — с frame-потока VisionCamera.
final class HybridFrameSession: HybridFrameSessionSpec {
  /// Нативные фолбэки опций; обязаны совпадать с `VISION_ENGINE_DEFAULTS`
  private enum Defaults {
    static let iouThreshold = 0.45
    static let minRoiSizePx = 32.0
  }

  private var pixelBuffer: CVPixelBuffer?
  private let orientation: CGImagePropertyOrientation
  private let models: [String: CoreMLObjectDetector]
  let width: Double
  let height: Double

  init(
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    width: Double,
    height: Double,
    models: [String: CoreMLObjectDetector]
  ) {
    self.pixelBuffer = pixelBuffer
    self.orientation = orientation
    self.width = width
    self.height = height
    self.models = models
    super.init()
  }

  var memorySize: Int {
    return pixelBuffer.map { CVPixelBufferGetDataSize($0) } ?? 0
  }

  func dispose() {
    pixelBuffer = nil
  }

  func detect(model: String, options: DetectOptions) throws -> [DetectedObject] {
    guard let detector = models[model] else {
      throw RuntimeError.error(withMessage: "VisionEngine: model «\(model)» is not loaded — call loadModel() first")
    }
    var detections = try detector.detect(
      pixelBuffer: try frameBuffer(),
      orientation: orientation,
      minScore: Float(options.minScore),
      iouThreshold: CGFloat(options.iouThreshold ?? Defaults.iouThreshold)
    )
    if let maxResults = options.maxResults {
      detections = Array(detections.prefix(max(0, Int(maxResults))))
    }

    return detections.map { detection in
      DetectedObject(
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

  func recognize(rois: [OcrRoi], options: OcrOptions) throws -> [OcrRoiResult] {
    let buffer = try frameBuffer()
    let minSide = CGFloat(options.minRoiSizePx ?? Defaults.minRoiSizePx)

    // области, прошедшие по размеру, читаются одним проходом Vision
    var regions: [CGRect] = []
    var targets: [Int] = []
    for (index, roi) in rois.enumerated() {
      let rect = FrameGeometry.pad(
        CGRect(x: roi.rect.x, y: roi.rect.y, width: roi.rect.width, height: roi.rect.height),
        by: CGFloat(roi.padding ?? 0)
      )
      if rect.width * CGFloat(width) < minSide || rect.height * CGFloat(height) < minSide {
        continue
      }
      regions.append(FrameGeometry.toVisionROI(rect))
      targets.append(index)
    }

    var results = rois.map { _ in OcrRoiResult(read: false, observations: []) }
    if regions.isEmpty {
      return results
    }
    let texts = try VisionTextRecognizer.recognize(
      in: buffer,
      orientation: orientation,
      regions: regions,
      options: options
    )
    for (position, index) in targets.enumerated() {
      results[index] = OcrRoiResult(
        read: true,
        observations: Self.limit(texts[position], options: options)
      )
    }

    return results
  }

  /// Порог уверенности и лимит строк области, по убыванию уверенности
  private static func limit(_ observations: [OcrObservation], options: OcrOptions) -> [OcrObservation] {
    let sorted = observations
      .filter { $0.confidence >= options.minConfidence }
      .sorted { $0.confidence > $1.confidence }
    guard let maxObservations = options.maxObservations else {
      return sorted
    }

    return Array(sorted.prefix(max(0, Int(maxObservations))))
  }

  private func frameBuffer() throws -> CVPixelBuffer {
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "VisionEngine: FrameSession is already disposed")
    }
    return pixelBuffer
  }
}
