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
  /** Индекс класса модели; -1 — класс не сопоставлен индексу */
  val classIndex: Int,
  /** Имя класса; пустая строка — имя неизвестно */
  val label: String = "",
)

/**
 * Чистый декодер сырых тензоров детекции (без зависимостей от Android/TFLite).
 * Выход — плоский массив с формой `[rows, cols]` (ведущие единичные оси
 * отброшены). Форматы различаются по размерности:
 * - классический: `[C, N]`/`[N, C]`, тысячи кандидатов `cx,cy,w,h` и оценки
 *   классов — фильтр по score, затем `nms`;
 * - end-to-end: `[N, 6]` с малым N — готовые боксы `x1,y1,x2,y2,score,class`.
 * Координаты возвращаются нормализованными относительно входа модели.
 */
internal object YoloOutputDecoder {
  /** Верхняя граница числа детекций end-to-end выхода (обычно 300) */
  const val MAX_END_TO_END_DETECTIONS = 512

  /** Форма выхода без ведущих единичных осей; null — не двумерная */
  fun matrixShape(shape: IntArray): Pair<Int, Int>? {
    val dims = shape.dropWhile { it == 1 }

    return if (dims.size == 2) dims[0] to dims[1] else null
  }

  /** Выход `[N, 6]` с небольшим N — сеть уже вернула финальные детекции */
  fun isEndToEnd(rows: Int, cols: Int): Boolean {
    return cols == 6 && rows <= MAX_END_TO_END_DETECTIONS
  }

  /** Число классов классического выхода; 0 — end-to-end или форма не распознана */
  fun classCount(rows: Int, cols: Int): Int {
    if (isEndToEnd(rows, cols)) {
      return 0
    }
    val channels = min(rows, cols)

    return if (channels > 4) channels - 4 else 0
  }

  /** Выход модели → детекции, отсортированные по score (классический — после NMS) */
  fun decode(
    values: FloatArray,
    rows: Int,
    cols: Int,
    inputWidth: Int,
    inputHeight: Int,
    boxUnits: DetectorBoxUnits,
    minScore: Float,
    iouThreshold: Float,
  ): List<DetectedRegion> {
    val normalizer = BoxNormalizer(inputWidth.toFloat(), inputHeight.toFloat(), boxUnits)

    return if (isEndToEnd(rows, cols)) {
      decodeEndToEnd(values, rows, cols, normalizer, minScore)
    } else {
      nms(decodeClassic(values, rows, cols, normalizer, minScore), iouThreshold)
    }
  }

  private fun decodeClassic(
    values: FloatArray,
    rows: Int,
    cols: Int,
    normalizer: BoxNormalizer,
    minScore: Float,
  ): List<DetectedRegion> {
    val channelsFirst = rows < cols
    val count = if (channelsFirst) cols else rows
    val channels = if (channelsFirst) rows else cols
    if (channels <= 4) {
      return emptyList()
    }

    fun value(channel: Int, index: Int): Float =
      if (channelsFirst) values[channel * cols + index] else values[index * cols + channel]

    val regions = ArrayList<DetectedRegion>()
    val box = FloatArray(4)
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
      normalizer.normalize(value(0, i), value(1, i), value(2, i), value(3, i), box)
      val x = (box[0] - box[2] / 2f).coerceIn(0f, 1f)
      val y = (box[1] - box[3] / 2f).coerceIn(0f, 1f)
      regions.add(
        DetectedRegion(
          x = x,
          y = y,
          width = min(box[2], 1f - x),
          height = min(box[3], 1f - y),
          score = score,
          classIndex = classIndex,
        ),
      )
    }

    return regions
  }

  private fun decodeEndToEnd(
    values: FloatArray,
    rows: Int,
    cols: Int,
    normalizer: BoxNormalizer,
    minScore: Float,
  ): List<DetectedRegion> {
    val regions = ArrayList<DetectedRegion>()
    val box = FloatArray(4)
    for (i in 0 until rows) {
      val offset = i * cols
      val score = values[offset + 4]
      if (score < minScore) {
        continue
      }
      normalizer.normalize(values[offset], values[offset + 1], values[offset + 2], values[offset + 3], box)
      val x1 = box[0].coerceIn(0f, 1f)
      val y1 = box[1].coerceIn(0f, 1f)
      val x2 = box[2].coerceIn(0f, 1f)
      val y2 = box[3].coerceIn(0f, 1f)
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
          classIndex = values[offset + 5].toInt(),
        ),
      )
    }
    regions.sortByDescending { it.score }

    return regions
  }

  /**
   * Жадный NMS внутри класса: кандидат с IoU выше порога к уже принятой
   * детекции ТОГО ЖЕ класса отбрасывается. Боксы разных классов друг друга
   * не подавляют — у многоклассовых моделей соседние области частично
   * перекрываются.
   */
  private fun nms(regions: List<DetectedRegion>, iouThreshold: Float): List<DetectedRegion> {
    val sorted = regions.sortedByDescending { it.score }
    val kept = ArrayList<DetectedRegion>()
    for (candidate in sorted) {
      if (kept.none { it.classIndex == candidate.classIndex && iou(it, candidate) > iouThreshold }) {
        kept.add(candidate)
      }
    }

    return kept
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

  /**
   * Координаты бокса → доли входа. В auto-режиме бокс считается пиксельным,
   * если хоть одна его координата выходит за пределы [0..1.5].
   */
  private class BoxNormalizer(
    private val inputWidth: Float,
    private val inputHeight: Float,
    private val units: DetectorBoxUnits,
  ) {
    fun normalize(a: Float, b: Float, c: Float, d: Float, out: FloatArray) {
      val pixels = when (units) {
        DetectorBoxUnits.PIXELS -> true
        DetectorBoxUnits.NORMALIZED -> false
        DetectorBoxUnits.AUTO -> max(max(a, b), max(c, d)) > 1.5f
      }
      if (pixels) {
        out[0] = a / inputWidth
        out[1] = b / inputHeight
        out[2] = c / inputWidth
        out[3] = d / inputHeight
      } else {
        out[0] = a
        out[1] = b
        out[2] = c
        out[3] = d
      }
    }
  }
}
