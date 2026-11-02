package com.margelo.nitro.visionengine

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import org.tensorflow.lite.DataType
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Прогон TFLite-модели детекции по выпрямленному кадру. Вход — RGB
 * `[1, H, W, 3]` либо `[1, 3, H, W]` в float32 или квантованный uint8/int8;
 * выход — один тензор, который после отбрасывания единичных осей двумерен
 * (float32 или квантованный), формат разбирает `YoloOutputDecoder`.
 *
 * Кадр подаётся letterbox'ом (пропорции + серые поля 114) либо растяжением;
 * координаты детекций пересчитываются обратно в систему кадра.
 *
 * Экземпляры кэшируются по модели и вычислителю на всё приложение и
 * шарятся между движками; `detect` синхронизирован — Interpreter и
 * переиспользуемые буферы прогона не потокобезопасны.
 */
internal class TfliteDetector private constructor(private val model: TfliteModel) {
  private val interpreter = model.interpreter
  private val inputTensor = interpreter.getInputTensor(0)
  private val outputTensor = interpreter.getOutputTensor(0)
  private val inputShape: IntArray = inputTensor.shape()

  /** Вход `[1, 3, H, W]` — каналы первыми */
  private val inputChannelsFirst: Boolean =
    inputShape.size == 4 && inputShape[1] == 3 && inputShape[3] != 3

  val inputWidth: Int = if (inputChannelsFirst) inputShape[3] else inputShape[2]
  val inputHeight: Int = if (inputChannelsFirst) inputShape[2] else inputShape[1]

  private val outputRows: Int
  private val outputCols: Int

  init {
    require(inputShape.size == 4) {
      "VisionEngine: unsupported model input shape ${inputShape.contentToString()}"
    }
    val matrix = YoloOutputDecoder.matrixShape(outputTensor.shape())
    requireNotNull(matrix) {
      "VisionEngine: unsupported model output shape ${outputTensor.shape().contentToString()}"
    }
    outputRows = matrix.first
    outputCols = matrix.second
  }

  /** Имена классов из метаданных модели */
  val labels: List<String> get() = model.labels

  /** Число классов по форме выхода; 0 — не определено */
  val outputClassCount: Int = YoloOutputDecoder.classCount(outputRows, outputCols)

  private val inputType: DataType = inputTensor.dataType()
  private val inputScale: Float = inputTensor.quantizationParams().scale
  private val inputZeroPoint: Int = inputTensor.quantizationParams().zeroPoint
  private val outputType: DataType = outputTensor.dataType()
  private val outputScale: Float = outputTensor.quantizationParams().scale
  private val outputZeroPoint: Int = outputTensor.quantizationParams().zeroPoint

  // Переиспользуемые буферы прогона — аллоцируются один раз на модель
  private val inputBuffer: ByteBuffer =
    ByteBuffer.allocateDirect(inputTensor.numBytes()).order(ByteOrder.nativeOrder())
  private val outputBuffer: ByteBuffer =
    ByteBuffer.allocateDirect(outputTensor.numBytes()).order(ByteOrder.nativeOrder())
  private val outputValues = FloatArray(outputRows * outputCols)
  private val pixels = IntArray(inputWidth * inputHeight)
  private val inputBitmap: Bitmap =
    Bitmap.createBitmap(inputWidth, inputHeight, Bitmap.Config.ARGB_8888)
  private val inputCanvas = Canvas(inputBitmap)
  private val inputPaint = Paint(Paint.FILTER_BITMAP_FLAG)
  private val contentRect = RectF()

  /** Детекции по выпрямленному кадру: подготовка входа → инференс → декодер → координаты кадра */
  @Synchronized
  fun detect(
    upright: Bitmap,
    resize: DetectorResizeMode,
    boxUnits: DetectorBoxUnits,
    minScore: Float,
    iouThreshold: Float,
  ): List<DetectedRegion> {
    placeContent(upright, resize)
    inputCanvas.drawColor(LETTERBOX_FILL)
    inputCanvas.drawBitmap(upright, null, contentRect, inputPaint)

    fillInputBuffer()
    outputBuffer.rewind()
    interpreter.run(inputBuffer, outputBuffer)
    readOutput()

    return YoloOutputDecoder
      .decode(
        outputValues,
        outputRows,
        outputCols,
        inputWidth,
        inputHeight,
        boxUnits,
        minScore,
        iouThreshold,
      )
      .mapNotNull(::toFrame)
  }

  /** Область кадра во входе модели: по центру с полями либо на весь вход */
  private fun placeContent(upright: Bitmap, resize: DetectorResizeMode) {
    if (resize == DetectorResizeMode.STRETCH) {
      contentRect.set(0f, 0f, inputWidth.toFloat(), inputHeight.toFloat())
      return
    }
    val scale = min(
      inputWidth / upright.width.toFloat(),
      inputHeight / upright.height.toFloat(),
    )
    val contentWidth = upright.width * scale
    val contentHeight = upright.height * scale
    val left = (inputWidth - contentWidth) / 2f
    val top = (inputHeight - contentHeight) / 2f
    contentRect.set(left, top, left + contentWidth, top + contentHeight)
  }

  /** inputBitmap → тензор входа: RGB [0..1] либо квантованные значения */
  private fun fillInputBuffer() {
    inputBitmap.getPixels(pixels, 0, inputWidth, 0, 0, inputWidth, inputHeight)
    inputBuffer.clear()
    if (inputType == DataType.FLOAT32 && !inputChannelsFirst) {
      for (pixel in pixels) {
        inputBuffer.putFloat(((pixel shr 16) and 0xFF) / 255f)
        inputBuffer.putFloat(((pixel shr 8) and 0xFF) / 255f)
        inputBuffer.putFloat((pixel and 0xFF) / 255f)
      }
      inputBuffer.rewind()
      return
    }
    val planeSize = pixels.size
    for (index in pixels.indices) {
      val pixel = pixels[index]
      writeInput(0, index, planeSize, (pixel shr 16) and 0xFF)
      writeInput(1, index, planeSize, (pixel shr 8) and 0xFF)
      writeInput(2, index, planeSize, pixel and 0xFF)
    }
    inputBuffer.rewind()
  }

  private fun writeInput(channel: Int, pixelIndex: Int, planeSize: Int, value: Int) {
    val element = if (inputChannelsFirst) channel * planeSize + pixelIndex else pixelIndex * 3 + channel
    when (inputType) {
      DataType.FLOAT32 -> inputBuffer.putFloat(element * 4, value / 255f)
      DataType.UINT8 -> inputBuffer.put(element, quantize(value, 0, 255).toByte())
      DataType.INT8 -> inputBuffer.put(element, quantize(value, -128, 127).toByte())
      else -> throw IllegalStateException("VisionEngine: unsupported model input type $inputType")
    }
  }

  /** Канал пикселя [0..255] → квантованное значение входа */
  private fun quantize(value: Int, minValue: Int, maxValue: Int): Int {
    if (inputScale == 0f) {
      return (value + minValue).coerceIn(minValue, maxValue)
    }

    return ((value / 255f) / inputScale + inputZeroPoint).roundToInt().coerceIn(minValue, maxValue)
  }

  /** Тензор выхода → float-значения (с деквантованием) */
  private fun readOutput() {
    outputBuffer.rewind()
    when (outputType) {
      DataType.FLOAT32 -> outputBuffer.asFloatBuffer().get(outputValues)
      DataType.UINT8 -> for (i in outputValues.indices) {
        outputValues[i] = dequantize(outputBuffer.get(i).toInt() and 0xFF)
      }
      DataType.INT8 -> for (i in outputValues.indices) {
        outputValues[i] = dequantize(outputBuffer.get(i).toInt())
      }
      else -> throw IllegalStateException("VisionEngine: unsupported model output type $outputType")
    }
  }

  private fun dequantize(value: Int): Float {
    return if (outputScale == 0f) value.toFloat() else (value - outputZeroPoint) * outputScale
  }

  /** Координаты входа модели → нормализованные координаты кадра; null — бокс ушёл в поля */
  private fun toFrame(region: DetectedRegion): DetectedRegion? {
    val contentWidth = contentRect.width()
    val contentHeight = contentRect.height()
    val x = (region.x * inputWidth - contentRect.left) / contentWidth
    val y = (region.y * inputHeight - contentRect.top) / contentHeight
    val width = region.width * inputWidth / contentWidth
    val height = region.height * inputHeight / contentHeight
    val left = x.coerceIn(0f, 1f)
    val top = y.coerceIn(0f, 1f)
    val right = (x + width).coerceIn(0f, 1f)
    val bottom = (y + height).coerceIn(0f, 1f)
    if (right - left <= 0f || bottom - top <= 0f) {
      return null
    }

    return region.copy(x = left, y = top, width = right - left, height = bottom - top)
  }

  companion object {
    /** Цвет полей letterbox — 114/114/114 */
    private const val LETTERBOX_FILL = 0xFF727272.toInt()

    private val cacheLock = Any()
    private val cache = HashMap<String, TfliteDetector>()

    /**
     * null — модель не найдена в assets. Экземпляры кэшируются по модели и
     * вычислителю на время жизни приложения — повторная загрузка (ремоунт
     * сканера, другой движок) не перечитывает asset и не создаёт Interpreter.
     */
    fun load(
      context: Context,
      assetName: String,
      accelerator: DetectorAccelerator,
      threads: Int,
    ): TfliteDetector? {
      val key = "$assetName|$accelerator|$threads"
      synchronized(cacheLock) {
        cache[key]?.let { return it }
        val model = TfliteModelLoader.load(context, assetName, accelerator, threads) ?: return null
        val detector = TfliteDetector(model)

        cache[key] = detector
        return detector
      }
    }
  }
}
