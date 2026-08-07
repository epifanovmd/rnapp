package com.margelo.nitro.ocrengine

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.max
import kotlin.math.min

/** Нормализованный [0..1] регион, найденный детектором */
internal data class DetectedRegion(
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
  val score: Float,
)

/**
 * TFLite-детектор регионов (YOLO, ultralytics-экспорт). Поддерживает два
 * поколения формата выхода, различаемых по размерности тензора:
 * - классический (v8/11/12): `[1, 4+nc, N]` или `[1, N, 4+nc]`, тысячи
 *   сырых кандидатов `cx,cy,w,h` — фильтр по score + собственный NMS;
 * - end-to-end (v10/26): `[1, N, 6]` с малым N — готовые боксы
 *   `x1,y1,x2,y2,score,class`, NMS не требуется.
 * Координаты нормализуются адаптивно: значения крупнее 1.5 считаются
 * пикселями входа модели.
 */
internal class YoloRegionDetector private constructor(
  private val interpreter: Interpreter,
) {
  private val inputSize: Int = interpreter.getInputTensor(0).shape()[1]
  private val outputShape: IntArray = interpreter.getOutputTensor(0).shape()

  /** `[1, N, 6]` с небольшим N — сеть уже вернула финальные детекции */
  private val isEndToEnd: Boolean =
    outputShape.size == 3 &&
      outputShape[2] == 6 &&
      outputShape[1] <= MAX_END_TO_END_DETECTIONS

  fun detect(upright: Bitmap, minScore: Float, iouThreshold: Float): List<DetectedRegion> {
    val scaled = Bitmap.createScaledBitmap(upright, inputSize, inputSize, true)
    val input = bitmapToFloatBuffer(scaled)
    if (scaled != upright) {
      scaled.recycle()
    }

    val output = Array(outputShape[1]) { FloatArray(outputShape[2]) }
    interpreter.run(input, arrayOf(output))

    return if (isEndToEnd) {
      decodeEndToEnd(output, minScore)
    } else {
      nms(decodeClassic(output, minScore), iouThreshold)
    }
  }

  fun close() {
    interpreter.close()
  }

  private fun bitmapToFloatBuffer(bitmap: Bitmap): ByteBuffer {
    val buffer = ByteBuffer
      .allocateDirect(inputSize * inputSize * 3 * 4)
      .order(ByteOrder.nativeOrder())
    val pixels = IntArray(inputSize * inputSize)
    bitmap.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize)
    for (pixel in pixels) {
      buffer.putFloat(((pixel shr 16) and 0xFF) / 255f)
      buffer.putFloat(((pixel shr 8) and 0xFF) / 255f)
      buffer.putFloat((pixel and 0xFF) / 255f)
    }
    buffer.rewind()

    return buffer
  }

  /** Значение > 1.5 — координата в пикселях входа модели, а не [0..1] */
  private fun normalized(value: Float): Float {
    return if (value > 1.5f) value / inputSize else value
  }

  /** Классический выход: `[C, N]` (каналы первыми) либо `[N, C]`, cx,cy,w,h */
  private fun decodeClassic(output: Array<FloatArray>, minScore: Float): List<DetectedRegion> {
    val channelsFirst = output.size < (output.firstOrNull()?.size ?: 0)
    val count = if (channelsFirst) output[0].size else output.size
    val channels = if (channelsFirst) output.size else output[0].size

    fun value(channel: Int, index: Int): Float =
      if (channelsFirst) output[channel][index] else output[index][channel]

    val regions = ArrayList<DetectedRegion>()
    for (i in 0 until count) {
      var score = 0f
      for (c in 4 until channels) {
        score = max(score, value(c, i))
      }
      if (score < minScore) {
        continue
      }
      val cx = normalized(value(0, i))
      val cy = normalized(value(1, i))
      val w = normalized(value(2, i))
      val h = normalized(value(3, i))
      val x = (cx - w / 2f).coerceIn(0f, 1f)
      val y = (cy - h / 2f).coerceIn(0f, 1f)
      regions.add(
        DetectedRegion(
          x = x,
          y = y,
          width = min(w, 1f - x),
          height = min(h, 1f - y),
          score = score,
        ),
      )
    }

    return regions
  }

  /** End-to-end выход: строки `x1,y1,x2,y2,score,class`, дублей нет */
  private fun decodeEndToEnd(output: Array<FloatArray>, minScore: Float): List<DetectedRegion> {
    val regions = ArrayList<DetectedRegion>()
    for (row in output) {
      val score = row[4]
      if (score < minScore) {
        continue
      }
      val x1 = normalized(row[0]).coerceIn(0f, 1f)
      val y1 = normalized(row[1]).coerceIn(0f, 1f)
      val x2 = normalized(row[2]).coerceIn(0f, 1f)
      val y2 = normalized(row[3]).coerceIn(0f, 1f)
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
        ),
      )
    }
    regions.sortByDescending { it.score }

    return regions
  }

  private fun nms(regions: List<DetectedRegion>, iouThreshold: Float): List<DetectedRegion> {
    val sorted = regions.sortedByDescending { it.score }
    val kept = ArrayList<DetectedRegion>()
    for (candidate in sorted) {
      if (kept.none { iou(it, candidate) > iouThreshold }) {
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

  companion object {
    /** Верхняя граница числа детекций у end-to-end моделей (обычно 300) */
    private const val MAX_END_TO_END_DETECTIONS = 512

    fun load(context: Context, assetName: String): YoloRegionDetector? {
      val bytes = try {
        context.assets.open(assetName).use { it.readBytes() }
      } catch (_: Exception) {
        return null
      }
      val model = ByteBuffer
        .allocateDirect(bytes.size)
        .order(ByteOrder.nativeOrder())
        .put(bytes)
      model.rewind()
      val options = Interpreter.Options().apply { numThreads = 2 }

      return YoloRegionDetector(Interpreter(model, options))
    }
  }
}
