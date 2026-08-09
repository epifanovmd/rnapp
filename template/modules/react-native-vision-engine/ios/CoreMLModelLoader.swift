import CoreML
import Foundation
import Vision

/// Загруженная CoreML-модель + сторона её входа (для нормализации координат)
struct LoadedCoreMLModel {
  let model: VNCoreMLModel
  /// Сторона квадратного входа модели, px
  let inputSide: CGFloat
}

/// Поиск и загрузка CoreML-моделей из бандла приложения.
/// Понимает и скомпилированный `.mlmodelc`, и сырой `.mlpackage`
/// (компилируется на устройстве при первом обращении).
/// Модели кэшируются по имени на время жизни приложения: повторный
/// `load` (ремоунт сканера, второй экземпляр движка) не перечитывает
/// и не перекомпилирует модель.
enum CoreMLModelLoader {
  private static let lock = NSLock()
  private static var cache: [String: LoadedCoreMLModel] = [:]

  // lock/unlock недоступны из async-контекста (Swift 6) — доступ к кэшу
  // инкапсулирован в синхронные функции без точек прерывания под локом

  private static func cached(_ modelName: String) -> LoadedCoreMLModel? {
    lock.lock()
    defer { lock.unlock() }
    return cache[modelName]
  }

  private static func store(_ model: LoadedCoreMLModel, named modelName: String) {
    lock.lock()
    cache[modelName] = model
    lock.unlock()
  }

  /// nil — модель не найдена в бандле
  static func load(named modelName: String) async throws -> LoadedCoreMLModel? {
    if let cached = cached(modelName) {
      return cached
    }

    var modelUrl = Bundle.main.url(forResource: modelName, withExtension: "mlmodelc")
    if modelUrl == nil,
       #available(iOS 16.0, *),
       let rawUrl = Bundle.main.url(forResource: modelName, withExtension: "mlpackage") {
      modelUrl = try await MLModel.compileModel(at: rawUrl)
    }
    guard let modelUrl else {
      return nil
    }

    let configuration = MLModelConfiguration()
    // GPU исключён намеренно: MPSGraph падает ассертом «MLIR pass manager
    // failed» на attention-опах YOLO-экспортов; ANE для свёрток быстрее GPU
    #if targetEnvironment(simulator)
    configuration.computeUnits = .cpuOnly
    #else
    if #available(iOS 16.0, *) {
      configuration.computeUnits = .cpuAndNeuralEngine
    } else {
      configuration.computeUnits = .cpuOnly
    }
    #endif
    let model = try MLModel(contentsOf: modelUrl, configuration: configuration)
    var inputSide: CGFloat = 640
    if let imageInput = model.modelDescription.inputDescriptionsByName.values
      .first(where: { $0.type == .image }),
      let constraint = imageInput.imageConstraint {
      inputSide = CGFloat(constraint.pixelsWide)
    }

    let loaded = LoadedCoreMLModel(model: try VNCoreMLModel(for: model), inputSide: inputSide)
    // параллельная загрузка того же имени просто перезапишет эквивалентную модель
    store(loaded, named: modelName)

    return loaded
  }
}
