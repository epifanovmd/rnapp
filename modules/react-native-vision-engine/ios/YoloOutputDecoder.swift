import CoreML
import Foundation

/// Детекция в нормализованных координатах (top-left origin)
struct RawDetection {
  var rect: CGRect
  let score: Float
  /// Индекс класса модели; -1 — класс не сопоставлен индексу
  var classIndex: Int32
  /// Имя класса; пустая строка — имя неизвестно
  var label: String
}

/// Чистый декодер сырых тензоров детекции. Поддерживает оба поколения
/// формата выхода, различаемых по размерности:
/// - классический: `[C, N]`/`[N, C]`, тысячи кандидатов `cx,cy,w,h` и
///   оценки классов — фильтр по score + NMS;
/// - end-to-end: `[N, 6]` с малым N — готовые боксы `x1,y1,x2,y2,score,class`.
/// Координаты возвращаются нормализованными относительно входа модели.
enum YoloOutputDecoder {
  /// Верхняя граница числа детекций end-to-end выхода (обычно 300)
  static let maxEndToEndDetections = 512

  /// Тензор выхода модели → детекции, отсортированные по score
  static func decode(
    _ array: MLMultiArray,
    inputWidth: CGFloat,
    inputHeight: CGFloat,
    boxUnits: DetectorBoxUnits,
    minConfidence: Float,
    iouThreshold: CGFloat
  ) -> [RawDetection] {
    var dims = array.shape.map { $0.intValue }
    var strides = array.strides.map { $0.intValue }
    while dims.count > 2 && dims[0] == 1 {
      dims.removeFirst()
      strides.removeFirst()
    }
    guard dims.count == 2, let read = makeReader(array) else {
      return []
    }
    let rows = dims[0]
    let cols = dims[1]
    let rowStride = strides[0]
    let colStride = strides[1]

    // координаты бокса → доли входа; в auto-режиме бокс считается
    // пиксельным, если хоть одна его координата выходит за пределы [0..1.5]
    func normalize(_ a: Float, _ b: Float, _ c: Float, _ d: Float) -> (CGFloat, CGFloat, CGFloat, CGFloat) {
      let pixels: Bool
      switch boxUnits {
      case .pixels:
        pixels = true
      case .normalized:
        pixels = false
      case .auto:
        pixels = max(a, b, c, d) > 1.5
      }
      if !pixels {
        return (CGFloat(a), CGFloat(b), CGFloat(c), CGFloat(d))
      }
      return (
        CGFloat(a) / inputWidth,
        CGFloat(b) / inputHeight,
        CGFloat(c) / inputWidth,
        CGFloat(d) / inputHeight
      )
    }

    var detections: [RawDetection] = []

    if cols == 6 && rows <= maxEndToEndDetections {
      for i in 0..<rows {
        let score = read(i * rowStride + 4 * colStride)
        if score < minConfidence {
          continue
        }
        let (x1, y1, x2, y2) = normalize(
          read(i * rowStride),
          read(i * rowStride + colStride),
          read(i * rowStride + 2 * colStride),
          read(i * rowStride + 3 * colStride)
        )
        if x2 <= x1 || y2 <= y1 {
          continue
        }
        detections.append(RawDetection(
          rect: CGRect(x: x1, y: y1, width: x2 - x1, height: y2 - y1),
          score: score,
          classIndex: Int32(read(i * rowStride + 5 * colStride)),
          label: ""
        ))
      }
    } else {
      let channelsFirst = rows < cols
      let count = channelsFirst ? cols : rows
      let channels = channelsFirst ? rows : cols
      guard channels > 4 else {
        return []
      }
      func value(_ channel: Int, _ index: Int) -> Float {
        return channelsFirst
          ? read(channel * rowStride + index * colStride)
          : read(index * rowStride + channel * colStride)
      }
      for i in 0..<count {
        var score: Float = 0
        var classIndex: Int32 = 0
        for c in 4..<channels {
          let classScore = value(c, i)
          if classScore > score {
            score = classScore
            classIndex = Int32(c - 4)
          }
        }
        if score < minConfidence {
          continue
        }
        let (cx, cy, w, h) = normalize(value(0, i), value(1, i), value(2, i), value(3, i))
        let x = max(cx - w / 2, 0)
        let y = max(cy - h / 2, 0)
        detections.append(RawDetection(
          rect: CGRect(x: x, y: y, width: min(w, 1 - x), height: min(h, 1 - y)),
          score: score,
          classIndex: classIndex,
          label: ""
        ))
      }
      detections = nonMaxSuppression(detections, iouThreshold: iouThreshold)
    }

    return detections.sorted { $0.score > $1.score }
  }

  /// Быстрое чтение MLMultiArray по плоскому индексу для float32/float16/double
  private static func makeReader(_ array: MLMultiArray) -> ((Int) -> Float)? {
    switch array.dataType {
    case .float32:
      let pointer = array.dataPointer.bindMemory(to: Float32.self, capacity: array.count)
      return { pointer[$0] }
    case .double:
      let pointer = array.dataPointer.bindMemory(to: Double.self, capacity: array.count)
      return { Float(pointer[$0]) }
    case .float16:
      #if arch(arm64)
      let pointer = array.dataPointer.bindMemory(to: Float16.self, capacity: array.count)
      return { Float(pointer[$0]) }
      #else
      return { Float(truncating: array[$0]) }
      #endif
    default:
      return nil
    }
  }

  /// Жадный NMS внутри класса: кандидат с IoU выше порога к уже принятой
  /// детекции ТОГО ЖЕ класса отбрасывается. Боксы разных классов друг друга
  /// не подавляют — у многоклассовых моделей соседние области частично
  /// перекрываются.
  private static func nonMaxSuppression(
    _ detections: [RawDetection],
    iouThreshold: CGFloat
  ) -> [RawDetection] {
    let sorted = detections.sorted { $0.score > $1.score }
    var kept: [RawDetection] = []
    for candidate in sorted {
      let overlaps = kept.contains {
        $0.classIndex == candidate.classIndex && iou($0.rect, candidate.rect) > iouThreshold
      }
      if !overlaps {
        kept.append(candidate)
      }
    }
    return kept
  }

  private static func iou(_ a: CGRect, _ b: CGRect) -> CGFloat {
    let intersection = a.intersection(b)
    if intersection.isNull || intersection.isEmpty {
      return 0
    }
    let intersectionArea = intersection.width * intersection.height
    let unionArea = a.width * a.height + b.width * b.height - intersectionArea
    return unionArea <= 0 ? 0 : intersectionArea / unionArea
  }
}
