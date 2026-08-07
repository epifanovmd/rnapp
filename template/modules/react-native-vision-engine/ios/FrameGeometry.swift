import CoreGraphics
import Foundation
import ImageIO
import VisionCamera

/// Геометрия кадра: ориентации и преобразования координат между
/// системами Vision (bottom-left) и контрактом модуля (top-left, upright).
enum FrameGeometry {
  /// CameraOrientation VisionCamera → CGImagePropertyOrientation для Vision.
  /// Конвенции поворотов противоположны: «rotated 90° left» VisionCamera
  /// соответствует EXIF `right`, поэтому left/right меняются местами
  /// (up/down — самоинверсные, без изменений).
  static func cgOrientation(
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
