package com.margelo.nitro.visionengine

import android.graphics.Bitmap
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.facebook.proguard.annotations.DoNotStrip
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Сессия распознавания одного кадра: детекция загруженными моделями и OCR
 * областей. Выпрямленный битмап кадра строится лениво один раз на сессию
 * и освобождается `dispose()` — JS освобождает сессию раньше самого кадра.
 * Вызовы — с frame-потока VisionCamera (не main).
 */
@DoNotStrip
internal class HybridFrameSession(
  private val proxy: ImageProxy,
  private val rotation: Int,
  private val models: Map<String, DetectorSlot>,
) : HybridFrameSessionSpec() {
  private val imageWidth: Int = if (rotation == 90 || rotation == 270) proxy.height else proxy.width
  private val imageHeight: Int = if (rotation == 90 || rotation == 270) proxy.width else proxy.height
  private var uprightBitmap: Bitmap? = null
  private var disposed = false

  override val width: Double
    get() = imageWidth.toDouble()

  override val height: Double
    get() = imageHeight.toDouble()

  override val memorySize: Long
    get() = uprightBitmap?.allocationByteCount?.toLong() ?: 0L

  override fun dispose() {
    disposed = true
    uprightBitmap?.recycle()
    uprightBitmap = null
  }

  override fun detect(model: String, options: DetectOptions): Array<DetectedObject> {
    val slot = models[model]
      ?: throw Error("VisionEngine: model «$model» is not loaded — call loadModel() first")
    var detections = slot.detect(
      upright(),
      minScore = options.minScore.toFloat(),
      iouThreshold = (options.iouThreshold ?: DEFAULT_IOU_THRESHOLD).toFloat(),
    )
    options.maxResults?.let { limit -> detections = detections.take(max(0, limit.roundToInt())) }

    return detections.map { region ->
      DetectedObject(
        classIndex = region.classIndex.toDouble(),
        label = region.label,
        score = region.score.toDouble(),
        rect = OcrRect(
          x = region.x.toDouble(),
          y = region.y.toDouble(),
          width = region.width.toDouble(),
          height = region.height.toDouble(),
        ),
      )
    }.toTypedArray()
  }

  override fun recognize(rois: Array<OcrRoi>, options: OcrOptions): Array<OcrRoiResult> {
    val minSizePx = (options.minRoiSizePx ?: DEFAULT_MIN_ROI_SIZE_PX).roundToInt()

    return rois.map { roi ->
      val padding = roi.padding ?: 0.0
      val observations = if (FrameGeometry.isFullFrame(roi.rect, padding)) {
        recognizeFullFrame()
      } else {
        recognizeCrop(roi.rect, padding, minSizePx)
      }
      if (observations == null) {
        OcrRoiResult(read = false, observations = emptyArray())
      } else {
        OcrRoiResult(read = true, observations = limit(observations, options).toTypedArray())
      }
    }.toTypedArray()
  }

  /** Полный кадр — ML Kit по media image с поворотом, без битмапа */
  @OptIn(ExperimentalGetImage::class)
  private fun recognizeFullFrame(): List<OcrObservation> {
    ensureActive()
    val image = proxy.image
      ?: throw Error("VisionEngine: Frame has no media Image — is it already disposed?")
    val text = MlKitTextRecognizer.recognize(image, rotation)

    return MlKitTextRecognizer.toObservations(text, imageWidth, imageHeight)
  }

  /** Кроп области; null — область слишком мала для OCR */
  private fun recognizeCrop(rect: OcrRect, padding: Double, minSizePx: Int): List<OcrObservation>? {
    val crop = FrameGeometry.cropRegion(upright(), rect, padding, minSizePx) ?: return null
    try {
      val text = MlKitTextRecognizer.recognize(crop.bitmap)
      return MlKitTextRecognizer
        .toObservations(text, crop.bitmap.width, crop.bitmap.height)
        .map { observation ->
          observation.copy(
            rect = FrameGeometry.shiftRect(observation.rect, crop, imageWidth, imageHeight),
          )
        }
    } finally {
      crop.bitmap.recycle()
    }
  }

  /** Порог уверенности и лимит строк области, по убыванию уверенности */
  private fun limit(observations: List<OcrObservation>, options: OcrOptions): List<OcrObservation> {
    val sorted = observations
      .filter { it.confidence >= options.minConfidence }
      .sortedByDescending { it.confidence }
    val maxObservations = options.maxObservations ?: return sorted

    return sorted.take(max(0, maxObservations.roundToInt()))
  }

  private fun upright(): Bitmap {
    ensureActive()
    return uprightBitmap
      ?: FrameGeometry.uprightBitmap(proxy, rotation).also { uprightBitmap = it }
  }

  private fun ensureActive() {
    if (disposed) {
      throw Error("VisionEngine: FrameSession is already disposed")
    }
  }

  private companion object {
    // Нативные фолбэки опций; обязаны совпадать с `VISION_ENGINE_DEFAULTS`
    const val DEFAULT_IOU_THRESHOLD = 0.45
    const val DEFAULT_MIN_ROI_SIZE_PX = 32.0
  }
}
