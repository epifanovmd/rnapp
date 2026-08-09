import CoreVideo
import Foundation
import Vision

/// OCR через Apple Vision (`VNRecognizeTextRequest`).
/// Возвращает области в нормализованных top-left координатах
/// ориентированного изображения (контракт модуля).
enum VisionTextRecognizer {
  /// Один проход Vision по кадру: `regionsOfInterest == nil` — полнокадровый
  /// запрос, иначе батч из запроса на каждый ROI — все выполняются одним
  /// `VNImageRequestHandler` (один проход подготовки изображения).
  static func recognize(
    in pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    regionsOfInterest: [CGRect]?,
    options: OcrScanOptions
  ) throws -> [OcrObservation] {
    let rois: [CGRect?] = regionsOfInterest ?? [nil]
    let requests = rois.map { roi -> VNRecognizeTextRequest in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = options.mode == .fast ? .fast : .accurate
      request.usesLanguageCorrection = false
      request.recognitionLanguages = ["en-US"]
      if let roi {
        request.regionOfInterest = roi
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
      let roi = rois[index]
      for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else {
          continue
        }
        var box = observation.boundingBox
        if let roi {
          // с regionOfInterest боксы нормализованы относительно ROI
          box = CGRect(
            x: roi.origin.x + box.origin.x * roi.width,
            y: roi.origin.y + box.origin.y * roi.height,
            width: box.width * roi.width,
            height: box.height * roi.height
          )
        }
        observations.append(OcrObservation(
          text: candidate.string,
          confidence: Double(candidate.confidence),
          rect: FrameGeometry.toTopLeftRect(box),
          fromDetector: roi != nil
        ))
      }
    }

    return observations
  }
}
