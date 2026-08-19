import AVFoundation
import Foundation
import NitroModules
import VisionCamera

/// Фасад nitro-спеки `VisionEngine`: держит слоты моделей и оркеструет
/// сервисы (`VisionTextRecognizer`, `CoreMLObjectDetector`,
/// `CoreMLModelLoader`, `FrameGeometry`). Логики распознавания здесь нет.
/// Все методы обработки синхронные — вызываются с frame-потока VisionCamera.
///
/// Слоты моделей — per-instance (у каждого сканера свой движок), сами
/// модели кэшируются `CoreMLModelLoader` по имени на всё приложение.
class HybridVisionEngine: HybridVisionEngineSpec {
  /// Фолбэки порогов детектора для вызовов без соответствующих полей опций.
  /// Обязаны совпадать с `DETECTOR_DEFAULTS` JS-модуля (рантайм-источник —
  /// значения, переданные в опциях).
  private enum DetectorDefaults {
    static let regionMinScore = 0.35
    static let maxRegions = 6.0
    static let maxRegionsPerClass = 2.0
    static let regionPadding = 0.18
    static let iouThreshold = 0.45
  }

  /// Запись слота — из async-контекста загрузки, чтение — с frame-потока;
  /// доступ только под `modelLock`. lock/unlock недоступны из async-контекста
  /// (Swift 6) — запись инкапсулирована в синхронные методы `store*`.
  private let modelLock = NSLock()
  private var detectorSlot: LoadedCoreMLModel?
  private var objectModelSlot: LoadedCoreMLModel?

  private var detector: LoadedCoreMLModel? {
    modelLock.lock()
    defer { modelLock.unlock() }
    return detectorSlot
  }

  private var objectModel: LoadedCoreMLModel? {
    modelLock.lock()
    defer { modelLock.unlock() }
    return objectModelSlot
  }

  private func storeDetector(_ model: LoadedCoreMLModel) {
    modelLock.lock()
    detectorSlot = model
    modelLock.unlock()
  }

  private func storeObjectModel(_ model: LoadedCoreMLModel) {
    modelLock.lock()
    objectModelSlot = model
    modelLock.unlock()
  }

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
      self.storeDetector(loaded)
      return true
    }
  }

  func loadObjectModel(modelName: String) throws -> Promise<Bool> {
    return Promise.async {
      guard let loaded = try await CoreMLModelLoader.load(named: modelName) else {
        return false
      }
      self.storeObjectModel(loaded)
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

  /// OCR кадра: с детектором — только по его регионам (ROI + padding,
  /// батч запросов одним handler'ом), без детектора или при пустых
  /// регионах — полнокадрово
  private func runOcr(
    _ context: FrameContext,
    options: OcrScanOptions
  ) throws -> OcrScanResult {
    let start = CACurrentMediaTime()
    let detector = self.detector

    var regions: [RawDetection] = []
    var observations: [OcrObservation] = []
    if let detector {
      // детектор наводит OCR на регионы интереса — читаем только их
      let detections = try CoreMLObjectDetector.detect(
        detector,
        pixelBuffer: context.pixelBuffer,
        orientation: context.orientation,
        minScore: Float(options.regionMinScore ?? DetectorDefaults.regionMinScore),
        iouThreshold: CGFloat(options.regionIouThreshold ?? DetectorDefaults.iouThreshold)
      )
      regions = Self.selectRegions(detections, options: options)
      if !regions.isEmpty {
        let padding = CGFloat(options.regionPadding ?? DetectorDefaults.regionPadding)
        let rois = regions.map { detection in
          OcrRegionOfInterest(
            rect: FrameGeometry.pad(FrameGeometry.toVisionROI(detection.rect), by: padding),
            classIndex: detection.classIndex
          )
        }
        observations = try VisionTextRecognizer.recognize(
          in: context.pixelBuffer,
          orientation: context.orientation,
          regions: rois,
          options: options
        )
      }
    }
    // без детектора полный кадр — единственный режим; с детектором полный
    // кадр читается только при явном fullFrameFallback и пустых кропах
    let fallbackAllowed = options.fullFrameFallback ?? false
    if detector == nil || (observations.isEmpty && fallbackAllowed) {
      observations = try VisionTextRecognizer.recognize(
        in: context.pixelBuffer,
        orientation: context.orientation,
        regions: nil,
        options: options
      )
    }

    observations = Self.limitObservations(
      observations
        .filter { $0.confidence >= options.minConfidence }
        .sorted { $0.confidence > $1.confidence },
      limit: max(0, Int(options.maxObservations))
    )

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
    guard let objectModel = self.objectModel else {
      throw RuntimeError.error(withMessage: "VisionEngine: object model is not loaded — call loadObjectModel() first")
    }

    var detections = try CoreMLObjectDetector.detect(
      objectModel,
      pixelBuffer: context.pixelBuffer,
      orientation: context.orientation,
      minScore: Float(options.minScore),
      iouThreshold: CGFloat(options.iouThreshold ?? DetectorDefaults.iouThreshold)
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

  /// Обрезка до лимита по кругу между регионами: строк таблички кратно
  /// больше, чем у номера, и глобальный top-N по уверенности вытеснил бы
  /// малые регионы целиком. Внутри региона порядок по уверенности сохраняется.
  private static func limitObservations(
    _ observations: [OcrObservation],
    limit: Int
  ) -> [OcrObservation] {
    if observations.count <= limit {
      return observations
    }

    var order: [Double] = []
    var groups: [Double: [OcrObservation]] = [:]
    for observation in observations {
      let key = observation.regionClassIndex
      if groups[key] == nil {
        order.append(key)
        groups[key] = []
      }
      groups[key]?.append(observation)
    }

    var result: [OcrObservation] = []
    var index = 0
    while result.count < limit {
      var appended = false
      for key in order {
        guard let group = groups[key], index < group.count else {
          continue
        }
        result.append(group[index])
        appended = true
        if result.count >= limit {
          break
        }
      }
      if !appended {
        break
      }
      index += 1
    }

    return result
  }

  /// Регионы детектора → те, что уходят в OCR: фильтр по разрешённым
  /// классам, затем квота на класс и общий лимит. Детекции приходят
  /// отсортированными по score, порядок сохраняется.
  private static func selectRegions(
    _ detections: [RawDetection],
    options: OcrScanOptions
  ) -> [RawDetection] {
    let maxRegions = max(0, Int(options.maxRegions ?? DetectorDefaults.maxRegions))
    let perClassLimit = Int(options.maxRegionsPerClass ?? DetectorDefaults.maxRegionsPerClass)
    let maxPerClass = perClassLimit > 0 ? perClassLimit : Int.max
    let allowed = options.regionClasses.flatMap { classes -> Set<Int32>? in
      classes.isEmpty ? nil : Set(classes.map { Int32($0) })
    }

    var counts: [Int32: Int] = [:]
    var selected: [RawDetection] = []
    for detection in detections {
      if selected.count >= maxRegions {
        break
      }
      if let allowed, !allowed.contains(detection.classIndex) {
        continue
      }
      let used = counts[detection.classIndex] ?? 0
      if used >= maxPerClass {
        continue
      }
      counts[detection.classIndex] = used + 1
      selected.append(detection)
    }

    return selected
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
