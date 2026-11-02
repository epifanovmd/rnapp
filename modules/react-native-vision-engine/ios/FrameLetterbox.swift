import CoreImage
import CoreVideo
import Foundation

/// Подготовка кадра под вход модели с сохранением пропорций: выпрямленный
/// кадр масштабируется в квадрат входа по центру, поля заливаются серым
/// 114/114/114. Буфер выхода переиспользуется между кадрами; вызовы
/// сериализуются владельцем (`CoreMLObjectDetector`).
final class FrameLetterbox {
  /// Результат подготовки: буфер входа и область кадра в нём
  struct Output {
    let pixelBuffer: CVPixelBuffer
    /// Область кадра во входе модели, доли входа (top-left origin)
    let content: CGRect
  }

  private static let context = CIContext(options: [.cacheIntermediates: false])
  private static let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)
  private static let fill = CIColor(red: 114 / 255, green: 114 / 255, blue: 114 / 255)

  private let width: Int
  private let height: Int
  private var buffer: CVPixelBuffer?

  init(width: Int, height: Int) {
    self.width = width
    self.height = height
  }

  /// nil — буфер входа не создался
  func render(
    _ pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation
  ) -> Output? {
    guard let target = targetBuffer() else {
      return nil
    }

    let oriented = CIImage(cvPixelBuffer: pixelBuffer).oriented(orientation)
    let extent = oriented.extent
    let targetWidth = CGFloat(width)
    let targetHeight = CGFloat(height)
    let scale = min(targetWidth / extent.width, targetHeight / extent.height)
    let contentWidth = extent.width * scale
    let contentHeight = extent.height * scale
    let offsetX = (targetWidth - contentWidth) / 2
    let offsetY = (targetHeight - contentHeight) / 2

    let placed = oriented
      .transformed(by: CGAffineTransform(translationX: -extent.minX, y: -extent.minY))
      .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
      .transformed(by: CGAffineTransform(translationX: offsetX, y: offsetY))
    let bounds = CGRect(x: 0, y: 0, width: targetWidth, height: targetHeight)
    let composed = placed.composited(over: CIImage(color: Self.fill).cropped(to: bounds))

    Self.context.render(composed, to: target, bounds: bounds, colorSpace: Self.colorSpace)

    // поля симметричны — смещение одинаково в bottom-left и top-left координатах
    return Output(
      pixelBuffer: target,
      content: CGRect(
        x: offsetX / targetWidth,
        y: offsetY / targetHeight,
        width: contentWidth / targetWidth,
        height: contentHeight / targetHeight
      )
    )
  }

  private func targetBuffer() -> CVPixelBuffer? {
    if let buffer {
      return buffer
    }
    let attributes: [CFString: Any] = [
      kCVPixelBufferIOSurfacePropertiesKey: [:] as [CFString: Any],
      kCVPixelBufferMetalCompatibilityKey: true,
    ]
    var created: CVPixelBuffer?
    CVPixelBufferCreate(
      kCFAllocatorDefault,
      width,
      height,
      kCVPixelFormatType_32BGRA,
      attributes as CFDictionary,
      &created
    )
    buffer = created

    return created
  }
}
