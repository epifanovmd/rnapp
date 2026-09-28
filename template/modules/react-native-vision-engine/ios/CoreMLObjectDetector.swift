import CoreML
import Foundation
import Vision

/// Прогон CoreML-модели детекции по кадру. Возвращает детекции в
/// нормализованных top-left координатах, отсортированные по score.
/// Поддерживает оба вида экспорта:
/// - пайплайн со встроенным NMS — Vision отдаёт готовые
///   `VNRecognizedObjectObservation` с метками классов;
/// - сырой тензор — разбирается `YoloOutputDecoder`.
enum CoreMLObjectDetector {
  static func detect(
    _ loaded: LoadedCoreMLModel,
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    minScore: Float,
    iouThreshold: CGFloat
  ) throws -> [RawDetection] {
    let request = VNCoreMLRequest(model: loaded.model)
    request.imageCropAndScaleOption = .scaleFill

    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: orientation,
      options: [:]
    )
    try handler.perform([request])

    let results = request.results ?? []
    let tensors = results.compactMap {
      ($0 as? VNCoreMLFeatureValueObservation)?.featureValue.multiArrayValue
    }
    if let tensor = tensors.first(where: { $0.shape.count >= 2 }) {
      return YoloOutputDecoder.decode(
        tensor,
        inputSide: loaded.inputSide,
        minConfidence: minScore,
        iouThreshold: iouThreshold
      )
    }

    return results
      .compactMap { $0 as? VNRecognizedObjectObservation }
      .filter { $0.confidence >= minScore }
      .sorted { $0.confidence > $1.confidence }
      .map { object in
        let box = object.boundingBox
        return RawDetection(
          rect: CGRect(
            x: box.minX,
            y: 1 - box.minY - box.height,
            width: box.width,
            height: box.height
          ),
          score: Float(object.confidence),
          classIndex: -1,
          label: object.labels.first?.identifier ?? ""
        )
      }
  }
}
