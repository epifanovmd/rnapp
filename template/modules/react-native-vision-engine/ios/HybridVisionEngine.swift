import AVFoundation
import Foundation
import NitroModules
import VisionCamera

/// Фасад nitro-спеки `VisionEngine`: реестр загруженных моделей и открытие
/// сессий кадра (`HybridFrameSession`). Логики распознавания здесь нет.
///
/// Реестр — per-instance (у каждого сканера свой движок), сами модели
/// кэшируются `CoreMLModelLoader` по имени на всё приложение.
class HybridVisionEngine: HybridVisionEngineSpec {
  /// Нативные фолбэки конфига модели; обязаны совпадать с `VISION_ENGINE_DEFAULTS`
  private static let modelDefaults = DetectorModelDefaults(resize: .letterbox, boxUnits: .auto)

  private static let notLoaded = DetectorModelInfo(
    loaded: false,
    labels: [],
    classCount: 0,
    inputWidth: 0,
    inputHeight: 0
  )

  /// Запись — из async-контекста загрузки, чтение — с frame-потока; доступ
  /// только под `modelLock`. lock/unlock недоступны из async-контекста
  /// (Swift 6) — доступ инкапсулирован в синхронные методы.
  private let modelLock = NSLock()
  private var models: [String: CoreMLObjectDetector] = [:]

  private func loadedModels() -> [String: CoreMLObjectDetector] {
    modelLock.lock()
    defer { modelLock.unlock() }
    return models
  }

  private func store(_ detector: CoreMLObjectDetector, named name: String) {
    modelLock.lock()
    models[name] = detector
    modelLock.unlock()
  }

  func loadModel(config: DetectorModelConfig) throws -> Promise<DetectorModelInfo> {
    return Promise.async {
      guard let model = try await CoreMLModelLoader.load(named: config.name) else {
        return Self.notLoaded
      }
      let detector = CoreMLObjectDetector(model: model, config: config, defaults: Self.modelDefaults)
      self.store(detector, named: config.name)
      return detector.info
    }
  }

  func openFrame(frame: any HybridFrameSpec) throws -> any HybridFrameSessionSpec {
    guard let nativeFrame = frame as? NativeFrame,
          let pixelBuffer = nativeFrame.sampleBuffer?.imageBuffer else {
      throw RuntimeError.error(withMessage: "VisionEngine: Frame has no pixel buffer — is it already disposed?")
    }

    let orientation = Self.cgOrientation(frame.orientation, isMirrored: frame.isMirrored)
    let bufferWidth = Double(CVPixelBufferGetWidth(pixelBuffer))
    let bufferHeight = Double(CVPixelBufferGetHeight(pixelBuffer))
    let isRotated = orientation.swapsDimensions

    // Vision получает ориентацию кадра и отдаёт координаты выпрямленного
    // изображения — размеры сессии тоже выпрямленные
    return HybridFrameSession(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      width: isRotated ? bufferHeight : bufferWidth,
      height: isRotated ? bufferWidth : bufferHeight,
      models: loadedModels()
    )
  }

  /// CameraOrientation VisionCamera → CGImagePropertyOrientation для Vision.
  /// Конвенции поворотов противоположны: «rotated 90° left» VisionCamera
  /// соответствует EXIF `right`, поэтому left/right меняются местами
  /// (up/down — самоинверсные, без изменений).
  private static func cgOrientation(
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
}
