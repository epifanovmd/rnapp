import CoreML
import Foundation
import Vision

/// Загруженная модель движка: CoreML-модель плюс способ её прогона из конфига.
/// Возвращает детекции в нормализованных top-left координатах выпрямленного
/// кадра, отсортированные по score, с индексом и именем класса.
/// Поддерживает оба вида модели:
/// - со встроенным NMS — Vision отдаёт готовые `VNRecognizedObjectObservation`;
/// - с сырым тензором — разбирается `YoloOutputDecoder`.
/// `detect` сериализован: буфер letterbox переиспользуется между кадрами.
final class CoreMLObjectDetector {
  let model: CoreMLModel
  /// Имена классов: из конфига, иначе из метаданных модели
  let labels: [String]
  private let boxUnits: DetectorBoxUnits
  /// nil — кадр растягивается на вход (`stretch`)
  private let letterbox: FrameLetterbox?
  private let lock = NSLock()

  init(model: CoreMLModel, config: DetectorModelConfig, defaults: DetectorModelDefaults) {
    self.model = model
    let configLabels = config.labels ?? []
    labels = configLabels.isEmpty ? model.labels : configLabels
    boxUnits = config.boxUnits ?? defaults.boxUnits

    let resize = config.resize ?? defaults.resize
    if resize == .letterbox && model.inputWidth > 0 && model.inputHeight > 0 {
      letterbox = FrameLetterbox(width: Int(model.inputWidth), height: Int(model.inputHeight))
    } else {
      letterbox = nil
    }
  }

  /// Описание модели для JS
  var info: DetectorModelInfo {
    return DetectorModelInfo(
      loaded: true,
      labels: labels,
      classCount: Double(labels.isEmpty ? model.outputClassCount : labels.count),
      inputWidth: Double(model.inputWidth),
      inputHeight: Double(model.inputHeight)
    )
  }

  func detect(
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    minScore: Float,
    iouThreshold: CGFloat
  ) throws -> [RawDetection] {
    lock.lock()
    defer { lock.unlock() }

    let request = VNCoreMLRequest(model: model.model)
    request.imageCropAndScaleOption = .scaleFill

    var content: CGRect?
    let handler: VNImageRequestHandler
    if let letterbox, let prepared = letterbox.render(pixelBuffer, orientation: orientation) {
      content = prepared.content
      handler = VNImageRequestHandler(cvPixelBuffer: prepared.pixelBuffer, orientation: .up, options: [:])
    } else {
      handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
    }
    try handler.perform([request])

    let detections = decode(request.results ?? [], minScore: minScore, iouThreshold: iouThreshold)
    guard let content else {
      return detections
    }

    return detections.compactMap { detection in
      guard let rect = FrameGeometry.unletterbox(detection.rect, content: content) else {
        return nil
      }
      var mapped = detection
      mapped.rect = rect
      return mapped
    }
  }

  /// Результаты Vision → детекции во входе модели с классами
  private func decode(
    _ results: [VNObservation],
    minScore: Float,
    iouThreshold: CGFloat
  ) -> [RawDetection] {
    let tensor = results
      .compactMap { ($0 as? VNCoreMLFeatureValueObservation)?.featureValue.multiArrayValue }
      .first { $0.shape.count >= 2 }
    if let tensor {
      return YoloOutputDecoder.decode(
        tensor,
        inputWidth: model.inputWidth,
        inputHeight: model.inputHeight,
        boxUnits: boxUnits,
        minConfidence: minScore,
        iouThreshold: iouThreshold
      ).map { detection in
        var labelled = detection
        labelled.label = label(at: Int(detection.classIndex))
        return labelled
      }
    }

    return results
      .compactMap { $0 as? VNRecognizedObjectObservation }
      .filter { $0.confidence >= minScore }
      .sorted { $0.confidence > $1.confidence }
      .map { object in
        let box = object.boundingBox
        let label = object.labels.first?.identifier ?? ""
        return RawDetection(
          rect: CGRect(x: box.minX, y: 1 - box.minY - box.height, width: box.width, height: box.height),
          score: Float(object.confidence),
          classIndex: Int32(labels.firstIndex(of: label) ?? -1),
          label: label
        )
      }
  }

  private func label(at index: Int) -> String {
    return labels.indices.contains(index) ? labels[index] : ""
  }
}

/// Нативные фолбэки конфига модели; обязаны совпадать с `DETECTOR_DEFAULTS`
struct DetectorModelDefaults {
  let resize: DetectorResizeMode
  let boxUnits: DetectorBoxUnits
}
