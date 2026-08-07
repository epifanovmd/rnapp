package com.margelo.nitro.visionengine

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Прогон TFLite-модели детекции (YOLO, ultralytics-экспорт) по Bitmap.
 * Формат выхода определяется по размерности тензора:
 * классический `[1, 4+nc, N]` (свой NMS) либо end-to-end `[1, N, 6]`
 * (v10/26, NMS не требуется) — декодирует `YoloOutputDecoder`.
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

  /** Детекции по выпрямленному кадру: масштаб к входу модели → инференс → декодер */
  fun detect(upright: Bitmap, minScore: Float, iouThreshold: Float): List<DetectedRegion> {
    val scaled = Bitmap.createScaledBitmap(upright, inputSize, inputSize, true)
    val input = bitmapToFloatBuffer(scaled)
    if (scaled != upright) {
      scaled.recycle()
    }

    val output = Array(outputShape[1]) { FloatArray(outputShape[2]) }
    interpreter.run(input, arrayOf(output))

    return if (isEndToEnd) {
      YoloOutputDecoder.decodeEndToEnd(output, inputSize, minScore)
    } else {
      YoloOutputDecoder.nms(
        YoloOutputDecoder.decodeClassic(output, inputSize, minScore),
        iouThreshold,
      )
    }
  }

  fun close() {
    interpreter.close()
  }

  /** Bitmap → float32 RGB [0..1] (NHWC), вход ultralytics-экспорта */
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

  companion object {
    /** Верхняя граница числа детекций у end-to-end моделей (обычно 300) */
    private const val MAX_END_TO_END_DETECTIONS = 512

    /** null — модель не найдена в assets */
    fun load(context: Context, assetName: String): TfliteDetector? {
      val interpreter = TfliteModelLoader.load(context, assetName) ?: return null

      return TfliteDetector(interpreter)
    }
  }
}
