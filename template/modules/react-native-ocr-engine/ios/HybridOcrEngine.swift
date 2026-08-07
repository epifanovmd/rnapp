import AVFoundation
import CoreML
import Foundation
import NitroModules
import Vision
import VisionCamera

/// Универсальный OCR: Apple Vision (`VNRecognizeTextRequest`) +
/// опциональный CoreML-детектор регионов интереса.
/// `scan` синхронный — вызывается с frame-потока VisionCamera.
class HybridOcrEngine: HybridOcrEngineSpec {
  /// Максимум регионов детектора, прогоняемых через OCR за кадр
  private static let maxDetectorRegions = 3
  /// Порог уверенности детектора регионов
  private static let detectorMinConfidence: VNConfidence = 0.35
  /// Расширение региона детектора перед OCR, доля от размеров региона
  private static let regionPadding: CGFloat = 0.18

  private var detector: VNCoreMLModel?

  var isDetectorLoaded: Bool {
    return detector != nil
  }

  func loadDetector(modelName: String) throws -> Promise<Bool> {
    return Promise.async {
      var modelUrl = Bundle.main.url(forResource: modelName, withExtension: "mlmodelc")
      if modelUrl == nil,
         #available(iOS 16.0, *),
         let rawUrl = Bundle.main.url(forResource: modelName, withExtension: "mlpackage") {
        // .mlpackage в бандле не скомпилирован — компилируем на устройстве
        modelUrl = try await MLModel.compileModel(at: rawUrl)
      }
      guard let modelUrl else {
        return false
      }

      let configuration = MLModelConfiguration()
      configuration.computeUnits = .all
      let model = try MLModel(contentsOf: modelUrl, configuration: configuration)
      self.detector = try VNCoreMLModel(for: model)
      return true
    }
  }

  func scan(frame: any HybridFrameSpec, options: OcrScanOptions) throws -> OcrScanResult {
    let start = CACurrentMediaTime()
    guard let nativeFrame = frame as? NativeFrame,
          let pixelBuffer = nativeFrame.sampleBuffer?.imageBuffer else {
      throw RuntimeError.error(withMessage: "OcrEngine: Frame has no pixel buffer — is it already disposed?")
    }

    let orientation = Self.cgOrientation(frame.orientation, isMirrored: frame.isMirrored)
    let isRotated = orientation.swapsDimensions
    let bufferWidth = CVPixelBufferGetWidth(pixelBuffer)
    let bufferHeight = CVPixelBufferGetHeight(pixelBuffer)
    let imageWidth = Double(isRotated ? bufferHeight : bufferWidth)
    let imageHeight = Double(isRotated ? bufferWidth : bufferHeight)

    var observations: [OcrObservation] = []
    if let detector {
      let regions = try detectRegions(detector, pixelBuffer: pixelBuffer, orientation: orientation)
      for region in regions.prefix(Self.maxDetectorRegions) {
        let padded = Self.pad(region, by: Self.regionPadding)
        observations += try recognizeText(
          in: pixelBuffer,
          orientation: orientation,
          regionOfInterest: padded,
          options: options
        )
      }
    }
    if observations.isEmpty {
      observations = try recognizeText(
        in: pixelBuffer,
        orientation: orientation,
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
      // Vision возвращает боксы уже в системе координат ориентированного
      // (выпрямленного) изображения — доворот на JS-стороне не нужен
      bufferOrientation: .up,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
      durationMs: (CACurrentMediaTime() - start) * 1000,
      detectorUsed: detector != nil
    )
  }

  // MARK: - Vision

  private func recognizeText(
    in pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    regionOfInterest: CGRect?,
    options: OcrScanOptions
  ) throws -> [OcrObservation] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = options.mode == .fast ? .fast : .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]
    if let regionOfInterest {
      request.regionOfInterest = regionOfInterest
    }

    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
    try handler.perform([request])

    guard let results = request.results else {
      return []
    }

    return results.compactMap { observation in
      guard let candidate = observation.topCandidates(1).first else {
        return nil
      }
      var box = observation.boundingBox
      if let roi = regionOfInterest {
        // с regionOfInterest боксы нормализованы относительно ROI
        box = CGRect(
          x: roi.origin.x + box.origin.x * roi.width,
          y: roi.origin.y + box.origin.y * roi.height,
          width: box.width * roi.width,
          height: box.height * roi.height
        )
      }
      return OcrObservation(
        text: candidate.string,
        confidence: Double(candidate.confidence),
        rect: Self.toTopLeftRect(box),
        fromDetector: regionOfInterest != nil
      )
    }
  }

  private func detectRegions(
    _ model: VNCoreMLModel,
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation
  ) throws -> [CGRect] {
    let request = VNCoreMLRequest(model: model)
    request.imageCropAndScaleOption = .scaleFill

    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
    try handler.perform([request])

    let objects = (request.results as? [VNRecognizedObjectObservation]) ?? []
    return objects
      .filter { $0.confidence >= Self.detectorMinConfidence }
      .sorted { $0.confidence > $1.confidence }
      .map { $0.boundingBox }
  }

  // MARK: - Geometry

  /// Vision отдаёт боксы в системе координат ориентированного изображения
  /// с началом в левом нижнем углу — переводим начало в верхний левый.
  private static func toTopLeftRect(_ box: CGRect) -> OcrRect {
    return OcrRect(
      x: box.origin.x,
      y: 1.0 - box.origin.y - box.height,
      width: box.width,
      height: box.height
    )
  }


  private static func pad(_ rect: CGRect, by fraction: CGFloat) -> CGRect {
    return rect
      .insetBy(dx: -rect.width * fraction, dy: -rect.height * fraction)
      .intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
  }

  /// CameraOrientation VisionCamera → CGImagePropertyOrientation для Vision.
  /// Конвенции поворотов противоположны: «rotated 90° left» VisionCamera
  /// соответствует EXIF `right`, поэтому left/right меняются местами
  /// (up/down — самоинверсные, без изменений).
  private static func cgOrientation(
    _ orientation: CameraOrientation,
    isMirrored: Bool
  ) -> CGImagePropertyOrientation {
    switch orientation {
    case .up:
      return isMirrored ? .upMirrored : .up
    case .down:
      return isMirrored ? .downMirrored : .down
    case .left:
      return isMirrored ? .rightMirrored : .right
    case .right:
      return isMirrored ? .leftMirrored : .left
    }
  }
}

private extension CGImagePropertyOrientation {
  /// Ориентация меняет местами ширину и высоту выпрямленного изображения
  var swapsDimensions: Bool {
    switch self {
    case .left, .leftMirrored, .right, .rightMirrored:
      return true
    default:
      return false
    }
  }
}
