package com.margelo.nitro.visionengine

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.min

/**
 * Прогон TFLite-модели детекции (YOLO, ultralytics-экспорт) по Bitmap.
 * Формат выхода определяется по размерности тензора:
 * классический `[1, 4+nc, N]` (свой NMS) либо end-to-end `[1, N, 6]`
 * (v10/26, NMS не требуется) — декодирует `YoloOutputDecoder`.
 *
 * Кадр подаётся letterbox'ом (масштаб с сохранением пропорций + серые
 * поля) — как в препроцессинге обучения ultralytics; координаты детекций
 * обратно пересчитываются в систему исходного кадра.
 *
 * Экземпляры кэшируются по имени asset'а на всё приложение и шарятся
 * между движками; `detect` синхронизирован — Interpreter и переиспользуемые
 * буферы прогона не потокобезопасны.
 */
internal class TfliteDetector private constructor(
  private val interpreter: Interpreter,
) {
  private val inputSize: Int = interpreter.getInputTensor(0).shape()[1]
  private val outputShape: IntArray = interpreter.getOutputTensor(0).shape()

  /** `[1, N, 6]` с небольшим N — сеть уже вернула финальные детекции */
  private val isEndToEnd: Boolean =
    outputShape.size == 3 &&
      outputShape[2] == 6 &&
      outputShape[1] <= MAX_END_TO_END_DETECTIONS

  // Переиспользуемые буферы прогона — аллоцируются один раз на модель
  private val inputBuffer: ByteBuffer = ByteBuffer
    .allocateDirect(inputSize * inputSize * 3 * 4)
    .order(ByteOrder.nativeOrder())
  private val pixels = IntArray(inputSize * inputSize)
  private val output = Array(outputShape[1]) { FloatArray(outputShape[2]) }
  private val letterboxBitmap: Bitmap =
    Bitmap.createBitmap(inputSize, inputSize, Bitmap.Config.ARGB_8888)
  private val letterboxCanvas = Canvas(letterboxBitmap)
  private val letterboxPaint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val contentRect = RectF()

  /** Детекции по выпрямленному кадру: letterbox → инференс → декодер → un-letterbox */
  @Synchronized
  fun detect(upright: Bitmap, minScore: Float, iouThreshold: Float): List<DetectedRegion> {
    val scale = min(
      inputSize / upright.width.toFloat(),
      inputSize / upright.height.toFloat(),
    )
    val contentWidth = upright.width * scale
    val contentHeight = upright.height * scale
    val padX = (inputSize - contentWidth) / 2f
    val padY = (inputSize - contentHeight) / 2f

    letterboxCanvas.drawColor(LETTERBOX_FILL)
    contentRect.set(padX, padY, padX + contentWidth, padY + contentHeight)
    letterboxCanvas.drawBitmap(upright, null, contentRect, letterboxPaint)

    fillInputBuffer()
    interpreter.run(inputBuffer, arrayOf<Any>(output))

    val decoded = if (isEndToEnd) {
      YoloOutputDecoder.decodeEndToEnd(output, inputSize, minScore)
    } else {
      YoloOutputDecoder.nms(
        YoloOutputDecoder.decodeClassic(output, inputSize, minScore),
        iouThreshold,
      )
    }

    return decoded.mapNotNull { region ->
      unletterbox(region, padX, padY, contentWidth, contentHeight)
    }
  }

  /** letterboxBitmap → float32 RGB [0..1] (NHWC), вход ultralytics-экспорта */
  private fun fillInputBuffer() {
    letterboxBitmap.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize)
    inputBuffer.clear()
    for (pixel in pixels) {
      inputBuffer.putFloat(((pixel shr 16) and 0xFF) / 255f)
      inputBuffer.putFloat(((pixel shr 8) and 0xFF) / 255f)
      inputBuffer.putFloat((pixel and 0xFF) / 255f)
    }
    inputBuffer.rewind()
  }

  /** Координаты входа модели → нормализованные координаты кадра; null — бокс ушёл в поля */
  private fun unletterbox(
    region: DetectedRegion,
    padX: Float,
    padY: Float,
    contentWidth: Float,
    contentHeight: Float,
  ): DetectedRegion? {
    val x = (region.x * inputSize - padX) / contentWidth
    val y = (region.y * inputSize - padY) / contentHeight
    val width = region.width * inputSize / contentWidth
    val height = region.height * inputSize / contentHeight
    val left = x.coerceIn(0f, 1f)
    val top = y.coerceIn(0f, 1f)
    val right = (x + width).coerceIn(0f, 1f)
    val bottom = (y + height).coerceIn(0f, 1f)
    if (right - left <= 0f || bottom - top <= 0f) {
      return null
    }

    return region.copy(
      x = left,
      y = top,
      width = right - left,
      height = bottom - top,
    )
  }

  companion object {
    /** Верхняя граница числа детекций у end-to-end моделей (обычно 300) */
    private const val MAX_END_TO_END_DETECTIONS = 512

    /** Цвет полей letterbox — 114/114/114, как в препроцессинге ultralytics */
    private const val LETTERBOX_FILL = 0xFF727272.toInt()

    private val cacheLock = Any()
    private val cache = HashMap<String, TfliteDetector>()

    /**
     * null — модель не найдена в assets. Экземпляры кэшируются по имени
     * на время жизни приложения — повторная загрузка (ремоунт сканера,
     * другой движок) не перечитывает asset и не создаёт Interpreter.
     */
    fun load(context: Context, assetName: String): TfliteDetector? {
      synchronized(cacheLock) {
        cache[assetName]?.let { return it }
        val interpreter = TfliteModelLoader.load(context, assetName) ?: return null
        val detector = TfliteDetector(interpreter)

        cache[assetName] = detector
        return detector
      }
    }
  }
}
