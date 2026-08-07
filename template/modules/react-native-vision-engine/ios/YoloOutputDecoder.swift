import CoreML
import Foundation

/// Детекция в нормализованных координатах (top-left origin)
struct RawDetection {
  let rect: CGRect
  let score: Float
  /// Индекс класса модели; -1 — класс известен только меткой
  let classIndex: Int32
  /// Метка класса, если модель её содержит; иначе пустая строка
  let label: String
}

/// Чистый декодер сырых тензоров YOLO. Поддерживает оба поколения формата
/// выхода, различаемых по размерности:
/// - классический (v8/11/12): `[C, N]`/`[N, C]`, тысячи кандидатов
///   `cx,cy,w,h` — фильтр по score + NMS;
/// - end-to-end (v10/26): `[N, 6]` с малым N — готовые боксы
///   `x1,y1,x2,y2,score,class`.
/// Координаты нормализуются адаптивно: значения крупнее 1.5 считаются
/// пикселями входа модели.
enum YoloOutputDecoder {
  /// Верхняя граница числа детекций у end-to-end моделей (обычно 300)
  private static let maxEndToEndDetections = 512
  private static let nmsIouThreshold: CGFloat = 0.45

  /// Тензор выхода модели → детекции, отсортированные по score
  static func decode(
    _ array: MLMultiArray,
    inputSide: CGFloat,
    minConfidence: Float
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

    func norm(_ value: Float) -> CGFloat {
      let cg = CGFloat(value)
      return cg > 1.5 ? cg / inputSide : cg
    }

    var detections: [RawDetection] = []

    if cols == 6 && rows <= maxEndToEndDetections {
      for i in 0..<rows {
        let score = read(i * rowStride + 4 * colStride)
        if score < minConfidence {
          continue
        }
        let x1 = norm(read(i * rowStride))
        let y1 = norm(read(i * rowStride + colStride))
        let x2 = norm(read(i * rowStride + 2 * colStride))
        let y2 = norm(read(i * rowStride + 3 * colStride))
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
        let cx = norm(value(0, i))
        let cy = norm(value(1, i))
        let w = norm(value(2, i))
        let h = norm(value(3, i))
        let x = max(cx - w / 2, 0)
        let y = max(cy - h / 2, 0)
        detections.append(RawDetection(
          rect: CGRect(x: x, y: y, width: min(w, 1 - x), height: min(h, 1 - y)),
          score: score,
          classIndex: classIndex,
          label: ""
        ))
      }
      detections = nonMaxSuppression(detections)
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

  /// Жадный NMS: кандидат с IoU выше порога к уже принятым отбрасывается
  private static func nonMaxSuppression(_ detections: [RawDetection]) -> [RawDetection] {
    let sorted = detections.sorted { $0.score > $1.score }
    var kept: [RawDetection] = []
    for candidate in sorted {
      let overlaps = kept.contains { iou($0.rect, candidate.rect) > nmsIouThreshold }
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
