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
  /// Верхняя граница числа детекций у end-to-end моделей (обычно 300)
  private static let maxEndToEndDetections = 512

  private var detector: VNCoreMLModel?
  /** Сторона входа модели детектора, px — для нормализации сырых координат */
  private var detectorInputSide: CGFloat = 640

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
      if let imageInput = model.modelDescription.inputDescriptionsByName.values
        .first(where: { $0.type == .image }),
        let constraint = imageInput.imageConstraint {
        self.detectorInputSide = CGFloat(constraint.pixelsWide)
      }
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

  /**
   * Регионы от детектора в Vision-координатах (bottom-left origin).
   * Поддерживает оба поколения экспорта YOLO:
   * - пайплайн со встроенным NMS (v8/11/12, `nms=True`) — Vision отдаёт
   *   готовые `VNRecognizedObjectObservation`;
   * - сырой тензор (v10/26 end-to-end либо экспорт без NMS) — разбирается
   *   вручную по размерности выхода.
   */
  private func detectRegions(
    _ model: VNCoreMLModel,
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation
  ) throws -> [CGRect] {
    let request = VNCoreMLRequest(model: model)
    request.imageCropAndScaleOption = .scaleFill

    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
    try handler.perform([request])

    let results = request.results ?? []
    let tensors = results.compactMap {
      ($0 as? VNCoreMLFeatureValueObservation)?.featureValue.multiArrayValue
    }
    if let tensor = tensors.first(where: { $0.shape.count >= 2 }) {
      return Self.decodeTensor(
        tensor,
        inputSide: detectorInputSide,
        minConfidence: Float(Self.detectorMinConfidence)
      )
    }

    let objects = results.compactMap { $0 as? VNRecognizedObjectObservation }
    return objects
      .filter { $0.confidence >= Self.detectorMinConfidence }
      .sorted { $0.confidence > $1.confidence }
      .map { $0.boundingBox }
  }

  // MARK: - Raw tensor decoding

  private struct RawDetection {
    /** top-left origin, нормализованный */
    let rect: CGRect
    let score: Float
  }

  private static func decodeTensor(
    _ array: MLMultiArray,
    inputSide: CGFloat,
    minConfidence: Float
  ) -> [CGRect] {
    var dims = array.shape.map { $0.intValue }
    var strides = array.strides.map { $0.intValue }
    while dims.count > 2 && dims[0] == 1 {
      dims.removeFirst()
      strides.removeFirst()
    }
    guard dims.count == 2, let read = makeReader(array) else {
      return []
    }
    let rows = dims[0]
    let cols = dims[1]
    let rowStride = strides[0]
    let colStride = strides[1]

    // значение > 1.5 — координата в пикселях входа модели, а не [0..1]
    func norm(_ value: Float) -> CGFloat {
      let cg = CGFloat(value)
      return cg > 1.5 ? cg / inputSide : cg
    }

    var detections: [RawDetection] = []

    if cols == 6 && rows <= Self.maxEndToEndDetections {
      // end-to-end: строки x1,y1,x2,y2,score,class — дублей нет
      for i in 0..<rows {
        let score = read(i * rowStride + 4 * colStride)
        if score < minConfidence {
          continue
        }
        let x1 = norm(read(i * rowStride))
        let y1 = norm(read(i * rowStride + colStride))
        let x2 = norm(read(i * rowStride + 2 * colStride))
        let y2 = norm(read(i * rowStride + 3 * colStride))
        if x2 <= x1 || y2 <= y1 {
          continue
        }
        detections.append(RawDetection(
          rect: CGRect(x: x1, y: y1, width: x2 - x1, height: y2 - y1),
          score: score
        ))
      }
    } else {
      // классический сырой выход: [C, N] (каналы первыми) либо [N, C]
      let channelsFirst = rows < cols
      let count = channelsFirst ? cols : rows
      let channels = channelsFirst ? rows : cols
      guard channels > 4 else {
        return []
      }
      func value(_ channel: Int, _ index: Int) -> Float {
        return channelsFirst
          ? read(channel * rowStride + index * colStride)
          : read(index * rowStride + channel * colStride)
      }
      for i in 0..<count {
        var score: Float = 0
        for c in 4..<channels {
          score = max(score, value(c, i))
        }
        if score < minConfidence {
          continue
        }
        let cx = norm(value(0, i))
        let cy = norm(value(1, i))
        let w = norm(value(2, i))
        let h = norm(value(3, i))
        let x = max(cx - w / 2, 0)
        let y = max(cy - h / 2, 0)
        detections.append(RawDetection(
          rect: CGRect(x: x, y: y, width: min(w, 1 - x), height: min(h, 1 - y)),
          score: score
        ))
      }
      detections = nonMaxSuppression(detections, iouThreshold: 0.45)
    }

    return detections
      .sorted { $0.score > $1.score }
      .map { detection in
        // top-left → bottom-left (система координат Vision ROI)
        CGRect(
          x: detection.rect.minX,
          y: 1 - detection.rect.minY - detection.rect.height,
          width: detection.rect.width,
          height: detection.rect.height
        )
      }
  }

  /** Быстрое чтение MLMultiArray по плоскому индексу для float32/float16/double */
  private static func makeReader(_ array: MLMultiArray) -> ((Int) -> Float)? {
    switch array.dataType {
    case .float32:
      let pointer = array.dataPointer.bindMemory(to: Float32.self, capacity: array.count)
      return { pointer[$0] }
    case .double:
      let pointer = array.dataPointer.bindMemory(to: Double.self, capacity: array.count)
      return { Float(pointer[$0]) }
    case .float16:
      #if arch(arm64)
      let pointer = array.dataPointer.bindMemory(to: Float16.self, capacity: array.count)
      return { Float(pointer[$0]) }
      #else
      return { Float(truncating: array[$0]) }
      #endif
    default:
      return nil
    }
  }

  private static func nonMaxSuppression(
    _ detections: [RawDetection],
    iouThreshold: CGFloat
  ) -> [RawDetection] {
    let sorted = detections.sorted { $0.score > $1.score }
    var kept: [RawDetection] = []
    for candidate in sorted {
      let overlaps = kept.contains { iou($0.rect, candidate.rect) > iouThreshold }
      if !overlaps {
        kept.append(candidate)
      }
    }
    return kept
  }

  private static func iou(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let intersection = a.intersection(b)
    if intersection.isNull || intersection.isEmpty {
      return 0
    }
    let intersectionArea = intersection.width * intersection.height
    let unionArea = a.width * a.height + b.width * b.height - intersectionArea
    return unionArea <= 0 ? 0 : intersectionArea / unionArea
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
