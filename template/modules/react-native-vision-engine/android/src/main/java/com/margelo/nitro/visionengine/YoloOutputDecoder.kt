package com.margelo.nitro.visionengine

import kotlin.math.max
import kotlin.math.min

/** Детекция в нормализованных [0..1] координатах (top-left origin) */
internal data class DetectedRegion(
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
  val score: Float,
  val classIndex: Int,
)

/**
 * Чистый декодер сырых выходов YOLO (без зависимостей от Android/TFLite).
 * Координаты нормализуются адаптивно: значения крупнее 1.5 считаются
 * пикселями входа модели (`inputSize`).
 */
internal object YoloOutputDecoder {
  /** Классический выход: `[C, N]` (каналы первыми) либо `[N, C]`, cx,cy,w,h */
  fun decodeClassic(
    output: Array<FloatArray>,
    inputSize: Int,
    minScore: Float,
  ): List<DetectedRegion> {
    val channelsFirst = output.size < (output.firstOrNull()?.size ?: 0)
    val count = if (channelsFirst) output[0].size else output.size
    val channels = if (channelsFirst) output.size else output[0].size

    fun value(channel: Int, index: Int): Float =
      if (channelsFirst) output[channel][index] else output[index][channel]

    val regions = ArrayList<DetectedRegion>()
    for (i in 0 until count) {
      var score = 0f
      var classIndex = 0
      for (c in 4 until channels) {
        val classScore = value(c, i)
        if (classScore > score) {
          score = classScore
          classIndex = c - 4
        }
      }
      if (score < minScore) {
        continue
      }
      val cx = normalized(value(0, i), inputSize)
      val cy = normalized(value(1, i), inputSize)
      val w = normalized(value(2, i), inputSize)
      val h = normalized(value(3, i), inputSize)
      val x = (cx - w / 2f).coerceIn(0f, 1f)
      val y = (cy - h / 2f).coerceIn(0f, 1f)
      regions.add(
        DetectedRegion(
          x = x,
          y = y,
          width = min(w, 1f - x),
          height = min(h, 1f - y),
          score = score,
          classIndex = classIndex,
        ),
      )
    }

    return regions
  }

  /** End-to-end выход: строки `x1,y1,x2,y2,score,class`, дублей нет */
  fun decodeEndToEnd(
    output: Array<FloatArray>,
    inputSize: Int,
    minScore: Float,
  ): List<DetectedRegion> {
    val regions = ArrayList<DetectedRegion>()
    for (row in output) {
      val score = row[4]
      if (score < minScore) {
        continue
      }
      val x1 = normalized(row[0], inputSize).coerceIn(0f, 1f)
      val y1 = normalized(row[1], inputSize).coerceIn(0f, 1f)
      val x2 = normalized(row[2], inputSize).coerceIn(0f, 1f)
      val y2 = normalized(row[3], inputSize).coerceIn(0f, 1f)
      if (x2 <= x1 || y2 <= y1) {
        continue
      }
      regions.add(
        DetectedRegion(
          x = x1,
          y = y1,
          width = x2 - x1,
          height = y2 - y1,
          score = score,
          classIndex = row[5].toInt(),
        ),
      )
    }
    regions.sortByDescending { it.score }

    return regions
  }

  /**
   * Жадный NMS внутри класса: кандидат с IoU выше порога к уже принятой
   * детекции ТОГО ЖЕ класса отбрасывается. Боксы разных классов друг друга
   * не подавляют — у многоклассовых моделей соседние области (номер, тип,
   * веса) частично перекрываются.
   */
  fun nms(regions: List<DetectedRegion>, iouThreshold: Float): List<DetectedRegion> {
    val sorted = regions.sortedByDescending { it.score }
    val kept = ArrayList<DetectedRegion>()
    for (candidate in sorted) {
      if (kept.none { it.classIndex == candidate.classIndex && iou(it, candidate) > iouThreshold }) {
        kept.add(candidate)
      }
    }

    return kept
  }

  private fun normalized(value: Float, inputSize: Int): Float {
    return if (value > 1.5f) value / inputSize else value
  }

  private fun iou(a: DetectedRegion, b: DetectedRegion): Float {
    val left = max(a.x, b.x)
    val top = max(a.y, b.y)
    val right = min(a.x + a.width, b.x + b.width)
    val bottom = min(a.y + a.height, b.y + b.height)
    if (right <= left || bottom <= top) {
      return 0f
    }
    val intersection = (right - left) * (bottom - top)
    val union = a.width * a.height + b.width * b.height - intersection

    return if (union <= 0f) 0f else intersection / union
  }
}
