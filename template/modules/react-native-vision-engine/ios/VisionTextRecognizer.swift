import CoreVideo
import Foundation
import Vision

/// OCR через Apple Vision (`VNRecognizeTextRequest`).
/// Возвращает области в нормализованных top-left координатах
/// ориентированного изображения (контракт модуля).
enum VisionTextRecognizer {
  static func recognize(
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

    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: orientation,
      options: [:]
    )
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
        rect: FrameGeometry.toTopLeftRect(box),
        fromDetector: regionOfInterest != nil
      )
    }
  }
}
