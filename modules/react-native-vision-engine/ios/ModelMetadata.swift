import Foundation

/// Разбор метаданных моделей детекции (чистые функции, без CoreML).
enum ModelMetadata {
  /// Ключ пользовательских метаданных с именами классов
  static let labelsKey = "names"

  /// Имена классов по индексу из строки метаданных. Понимает словарь
  /// `{0: 'a', 1: 'b'}` / `{"0": "a"}` и список `['a', 'b']` / `["a", "b"]`.
  /// Пропуски индексов заполняются пустыми строками.
  static func parseLabels(_ raw: String) -> [String] {
    let indexed = matches(of: #"(\d+)['"]?\s*:\s*['"]([^'"]*)['"]"#, in: raw)
    if !indexed.isEmpty {
      var byIndex: [Int: String] = [:]
      for groups in indexed {
        if let index = Int(groups[0]) {
          byIndex[index] = groups[1]
        }
      }
      guard let maxIndex = byIndex.keys.max() else {
        return []
      }
      return (0...maxIndex).map { byIndex[$0] ?? "" }
    }

    return matches(of: #"['"]([^'"]*)['"]"#, in: raw).map { $0[0] }
  }

  /// Число классов по форме выхода: классический `[4 + nc, N]` / `[N, 4 + nc]`;
  /// 0 — форма end-to-end `[N, 6]` либо не распознана
  static func classCount(outputShape: [Int], maxEndToEndDetections: Int) -> Int {
    let dims = outputShape.drop { $0 == 1 }
    guard dims.count == 2, let rows = dims.first, let cols = dims.last else {
      return 0
    }
    if cols == 6 && rows <= maxEndToEndDetections {
      return 0
    }
    let channels = min(rows, cols)

    return channels > 4 ? channels - 4 : 0
  }

  /// Группы захвата всех совпадений шаблона
  private static func matches(of pattern: String, in text: String) -> [[String]] {
    guard let regex = try? NSRegularExpression(pattern: pattern) else {
      return []
    }
    let range = NSRange(text.startIndex..., in: text)

    return regex.matches(in: text, range: range).map { match in
      (1..<match.numberOfRanges).compactMap { index in
        Swift.Range(match.range(at: index), in: text).map { String(text[$0]) }
      }
    }
  }
}
