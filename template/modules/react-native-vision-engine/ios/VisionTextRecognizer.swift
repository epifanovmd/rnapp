import CoreVideo
import Foundation
import Vision

/// OCR через Apple Vision (`VNRecognizeTextRequest`).
/// Возвращает строки в нормализованных top-left координатах
/// ориентированного (выпрямленного) изображения.
enum VisionTextRecognizer {
  /// Языки распознавания, когда опции их не задают
  private static let defaultLanguages = ["en-US"]

  /// Один проход Vision по кадру: запрос на каждую область, все выполняются
  /// одним `VNImageRequestHandler`. `regions` — области в координатах Vision
  /// (bottom-left origin); `result[i]` — строки `regions[i]`.
  static func recognize(
    in pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    regions: [CGRect],
    options: OcrOptions
  ) throws -> [[OcrObservation]] {
    let languages = options.languages ?? []
    let requests = regions.map { region -> VNRecognizeTextRequest in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = options.mode == .fast ? .fast : .accurate
      request.usesLanguageCorrection = false
      request.recognitionLanguages = languages.isEmpty ? defaultLanguages : languages
      request.regionOfInterest = region
      return request
    }

    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: orientation,
      options: [:]
    )
    try handler.perform(requests)

    return requests.enumerated().map { index, request in
      let region = regions[index]
      return (request.results ?? []).compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else {
          return nil
        }
        // с regionOfInterest боксы нормализованы относительно области
        let box = observation.boundingBox
        let frameBox = CGRect(
          x: region.origin.x + box.origin.x * region.width,
          y: region.origin.y + box.origin.y * region.height,
          width: box.width * region.width,
          height: box.height * region.height
        )
        return OcrObservation(
          text: candidate.string,
          confidence: Double(candidate.confidence),
          rect: FrameGeometry.toTopLeftRect(frameBox)
        )
      }
    }
  }
}
