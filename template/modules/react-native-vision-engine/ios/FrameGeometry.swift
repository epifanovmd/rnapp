import CoreGraphics
import Foundation
import ImageIO

/// Геометрия кадра: ориентации и преобразования координат между
/// системами Vision (bottom-left) и контрактом модуля (top-left, upright).
enum FrameGeometry {
  /// Vision отдаёт боксы с началом в левом нижнем углу —
  /// переводим начало в верхний левый (контракт модуля).
  static func toTopLeftRect(_ box: CGRect) -> OcrRect {
    return OcrRect(
      x: box.origin.x,
      y: 1.0 - box.origin.y - box.height,
      width: box.width,
      height: box.height
    )
  }

  /// top-left нормализованный бокс → ROI Vision (bottom-left origin)
  static func toVisionROI(_ rect: CGRect) -> CGRect {
    return CGRect(
      x: rect.minX,
      y: 1 - rect.minY - rect.height,
      width: rect.width,
      height: rect.height
    )
  }

  /// Бокс во входе модели → бокс выпрямленного кадра по области кадра
  /// во входе (letterbox); nil — бокс целиком в полях
  static func unletterbox(_ rect: CGRect, content: CGRect) -> CGRect? {
    guard content.width > 0, content.height > 0 else {
      return nil
    }
    let mapped = CGRect(
      x: (rect.minX - content.minX) / content.width,
      y: (rect.minY - content.minY) / content.height,
      width: rect.width / content.width,
      height: rect.height / content.height
    ).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))

    return mapped.isNull || mapped.isEmpty ? nil : mapped
  }

  /// Расширение прямоугольника на долю его размеров, с обрезкой по [0..1]
  static func pad(_ rect: CGRect, by fraction: CGFloat) -> CGRect {
    return rect
      .insetBy(dx: -rect.width * fraction, dy: -rect.height * fraction)
      .intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
  }
}

extension CGImagePropertyOrientation {
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
