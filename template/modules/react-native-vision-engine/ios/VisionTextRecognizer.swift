import CoreVideo
import Foundation
import Vision

/// Область интереса для OCR: прямоугольник в системе координат Vision
/// (bottom-left origin) и класс региона детектора, из которого он получен
struct OcrRegionOfInterest {
  let rect: CGRect
  /// Индекс класса детектора; попадает в `OcrObservation.regionClassIndex`
  let classIndex: Int32
}

/// OCR через Apple Vision (`VNRecognizeTextRequest`).
/// Возвращает области в нормализованных top-left координатах
/// ориентированного изображения (контракт модуля).
enum VisionTextRecognizer {
  /// Класс области, прочитанной полнокадровым OCR (детектор не участвовал)
  static let fullFrameClassIndex: Int32 = -1

  /// Один проход Vision по кадру: `regions == nil` — полнокадровый запрос,
  /// иначе батч из запроса на каждую область — все выполняются одним
  /// `VNImageRequestHandler` (один проход подготовки изображения).
  static func recognize(
    in pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    regions: [OcrRegionOfInterest]?,
    options: OcrScanOptions
  ) throws -> [OcrObservation] {
    let targets: [OcrRegionOfInterest?] = regions ?? [nil]
    let requests = targets.map { target -> VNRecognizeTextRequest in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = options.mode == .fast ? .fast : .accurate
      request.usesLanguageCorrection = false
      request.recognitionLanguages = ["en-US"]
      if let target {
        request.regionOfInterest = target.rect
      }
      return request
    }

    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: orientation,
      options: [:]
    )
    try handler.perform(requests)

    var observations: [OcrObservation] = []
    for (index, request) in requests.enumerated() {
      let target = targets[index]
      for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else {
          continue
        }
        var box = observation.boundingBox
        if let target {
          // с regionOfInterest боксы нормализованы относительно ROI
          box = CGRect(
            x: target.rect.origin.x + box.origin.x * target.rect.width,
            y: target.rect.origin.y + box.origin.y * target.rect.height,
            width: box.width * target.rect.width,
            height: box.height * target.rect.height
          )
        }
        observations.append(OcrObservation(
          text: candidate.string,
          confidence: Double(candidate.confidence),
          rect: FrameGeometry.toTopLeftRect(box),
          fromDetector: target != nil,
          regionClassIndex: Double(target?.classIndex ?? fullFrameClassIndex)
        ))
      }
    }

    return observations
  }
}
