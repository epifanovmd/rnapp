import CoreML
import Foundation
import Vision

/// Загруженная CoreML-модель и её описание
struct CoreMLModel {
  let model: VNCoreMLModel
  /// Размеры входа модели, px
  let inputWidth: CGFloat
  let inputHeight: CGFloat
  /// Имена классов из метаданных модели; пусто — модель их не содержит
  let labels: [String]
  /// Число классов по форме выхода; 0 — не определено
  let outputClassCount: Int
}

/// Поиск и загрузка CoreML-моделей из бандла приложения.
/// Понимает и скомпилированный `.mlmodelc`, и сырой `.mlpackage`
/// (компилируется на устройстве при первом обращении).
/// Модели кэшируются по имени на время жизни приложения: повторный
/// `load` (ремоунт сканера, второй экземпляр движка) не перечитывает
/// и не перекомпилирует модель.
enum CoreMLModelLoader {
  private static let lock = NSLock()
  private static var cache: [String: CoreMLModel] = [:]

  // lock/unlock недоступны из async-контекста (Swift 6) — доступ к кэшу
  // инкапсулирован в синхронные функции без точек прерывания под локом

  private static func cached(_ modelName: String) -> CoreMLModel? {
    lock.lock()
    defer { lock.unlock() }
    return cache[modelName]
  }

  private static func store(_ model: CoreMLModel, named modelName: String) {
    lock.lock()
    cache[modelName] = model
    lock.unlock()
  }

  /// nil — модель не найдена в бандле
  static func load(named modelName: String) async throws -> CoreMLModel? {
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
    // failed» на attention-операциях детекторов; ANE для свёрток быстрее GPU
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
    let description = model.modelDescription

    var inputWidth: CGFloat = 0
    var inputHeight: CGFloat = 0
    if let constraint = description.inputDescriptionsByName.values
      .first(where: { $0.type == .image })?.imageConstraint {
      inputWidth = CGFloat(constraint.pixelsWide)
      inputHeight = CGFloat(constraint.pixelsHigh)
    }

    let outputShape = description.outputDescriptionsByName.values
      .compactMap { $0.multiArrayConstraint?.shape.map { $0.intValue } }
      .first ?? []

    let loaded = CoreMLModel(
      model: try VNCoreMLModel(for: model),
      inputWidth: inputWidth,
      inputHeight: inputHeight,
      labels: labels(of: description),
      outputClassCount: ModelMetadata.classCount(
        outputShape: outputShape,
        maxEndToEndDetections: YoloOutputDecoder.maxEndToEndDetections
      )
    )
    // параллельная загрузка того же имени просто перезапишет эквивалентную модель
    store(loaded, named: modelName)

    return loaded
  }

  /// Имена классов: метки классификатора (модель со встроенным NMS),
  /// иначе пользовательские метаданные модели
  private static func labels(of description: MLModelDescription) -> [String] {
    if let classLabels = description.classLabels as? [String], !classLabels.isEmpty {
      return classLabels
    }
    let metadata = description.metadata[MLModelMetadataKey.creatorDefinedKey] as? [String: String]
    guard let raw = metadata?[ModelMetadata.labelsKey] else {
      return []
    }

    return ModelMetadata.parseLabels(raw)
  }
}
