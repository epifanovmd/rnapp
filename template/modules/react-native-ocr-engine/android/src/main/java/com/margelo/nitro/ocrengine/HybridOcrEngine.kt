package com.margelo.nitro.ocrengine

import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.Rect
import android.os.SystemClock
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.facebook.proguard.annotations.DoNotStrip
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Универсальный OCR: ML Kit Text Recognition + опциональный
 * TFLite-детектор регионов интереса.
 * `scan` синхронный — вызывается с frame-потока VisionCamera (не main).
 */
@DoNotStrip
class HybridOcrEngine : HybridOcrEngineSpec() {
  private val recognizer by lazy {
    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }
  private var detector: YoloRegionDetector? = null

  override val isDetectorLoaded: Boolean
    get() = detector != null

  override fun loadDetector(modelName: String): Promise<Boolean> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async false
      val loaded = YoloRegionDetector.load(context, "$modelName.tflite") ?: return@async false
      detector?.close()
      detector = loaded
      true
    }
  }

  @OptIn(ExperimentalGetImage::class)
  override fun scan(frame: HybridFrameSpec, options: OcrScanOptions): OcrScanResult {
    val start = SystemClock.elapsedRealtime()
    val nativeFrame = frame as? NativeFrame
      ?: throw Error("OcrEngine: unexpected Frame implementation — expected VisionCamera NativeFrame")
    val proxy = nativeFrame.image
    val rotation = proxy.imageInfo.rotationDegrees
    val rotated = rotation == 90 || rotation == 270
    val imageWidth = if (rotated) proxy.height else proxy.width
    val imageHeight = if (rotated) proxy.width else proxy.height

    val detector = this.detector
    var observations: List<OcrObservation> = emptyList()
    if (detector != null) {
      observations = scanWithDetector(detector, proxy, rotation, imageWidth, imageHeight)
    }
    if (observations.isEmpty()) {
      val mediaImage = proxy.image
        ?: throw Error("OcrEngine: Frame has no media Image — is it already disposed?")
      val text = Tasks.await(recognizer.process(InputImage.fromMediaImage(mediaImage, rotation)))
      observations = text.toObservations(imageWidth, imageHeight, fromDetector = false)
    }

    val filtered = observations
      .filter { it.confidence >= options.minConfidence }
      .sortedByDescending { it.confidence }
      .take(max(0, options.maxObservations.roundToInt()))

    return OcrScanResult(
      observations = filtered.toTypedArray(),
      // ML Kit получает rotationDegrees и отдаёт боксы уже в выпрямленных
      // координатах — дополнительное преобразование не требуется
      bufferOrientation = OcrBufferOrientation.UP,
      imageWidth = imageWidth.toDouble(),
      imageHeight = imageHeight.toDouble(),
      durationMs = (SystemClock.elapsedRealtime() - start).toDouble(),
      detectorUsed = detector != null,
    )
  }

  /** Детектор находит регионы кода — OCR прогоняется только по кропам */
  private fun scanWithDetector(
    detector: YoloRegionDetector,
    proxy: ImageProxy,
    rotation: Int,
    imageWidth: Int,
    imageHeight: Int,
  ): List<OcrObservation> {
    val upright = uprightBitmap(proxy, rotation)
    try {
      val regions = detector
        .detect(upright, minScore = DETECTOR_MIN_SCORE, iouThreshold = DETECTOR_NMS_IOU)
        .take(MAX_DETECTOR_REGIONS)

      return regions.flatMap { region ->
        val crop = cropRegion(upright, region) ?: return@flatMap emptyList()
        try {
          val text = Tasks.await(recognizer.process(InputImage.fromBitmap(crop.bitmap, 0)))
          text.toObservations(crop.bitmap.width, crop.bitmap.height, fromDetector = true)
            .map { it.shiftedBy(crop, imageWidth, imageHeight) }
        } finally {
          crop.bitmap.recycle()
        }
      }
    } finally {
      upright.recycle()
    }
  }

  private class RegionCrop(val bitmap: Bitmap, val left: Int, val top: Int)

  private fun cropRegion(upright: Bitmap, region: DetectedRegion): RegionCrop? {
    val padX = region.width * REGION_PADDING
    val padY = region.height * REGION_PADDING
    val left = ((region.x - padX) * upright.width).roundToInt().coerceAtLeast(0)
    val top = ((region.y - padY) * upright.height).roundToInt().coerceAtLeast(0)
    val right = ((region.x + region.width + padX) * upright.width).roundToInt()
      .coerceAtMost(upright.width)
    val bottom = ((region.y + region.height + padY) * upright.height).roundToInt()
      .coerceAtMost(upright.height)
    if (right - left < MIN_REGION_SIZE_PX || bottom - top < MIN_REGION_SIZE_PX) {
      return null
    }

    return RegionCrop(
      bitmap = Bitmap.createBitmap(upright, left, top, right - left, bottom - top),
      left = left,
      top = top,
    )
  }

  /** Координаты кропа → нормализованные координаты полного кадра */
  private fun OcrObservation.shiftedBy(
    crop: RegionCrop,
    imageWidth: Int,
    imageHeight: Int,
  ): OcrObservation {
    return OcrObservation(
      text = text,
      confidence = confidence,
      rect = OcrRect(
        x = (crop.left + rect.x * crop.bitmap.width) / imageWidth,
        y = (crop.top + rect.y * crop.bitmap.height) / imageHeight,
        width = rect.width * crop.bitmap.width / imageWidth,
        height = rect.height * crop.bitmap.height / imageHeight,
      ),
      fromDetector = true,
    )
  }

  private fun Text.toObservations(
    width: Int,
    height: Int,
    fromDetector: Boolean,
  ): List<OcrObservation> {
    return textBlocks.flatMap { block -> block.lines }.mapNotNull { line ->
      val box = line.boundingBox ?: return@mapNotNull null
      OcrObservation(
        text = line.text,
        confidence = line.confidence.toDouble(),
        rect = box.toNormalizedRect(width, height),
        fromDetector = fromDetector,
      )
    }
  }

  private fun Rect.toNormalizedRect(width: Int, height: Int): OcrRect {
    val x = (left.toDouble() / width).coerceIn(0.0, 1.0)
    val y = (top.toDouble() / height).coerceIn(0.0, 1.0)

    return OcrRect(
      x = x,
      y = y,
      width = (this.width().toDouble() / width).coerceAtMost(1.0 - x),
      height = (this.height().toDouble() / height).coerceAtMost(1.0 - y),
    )
  }

  private fun uprightBitmap(proxy: ImageProxy, rotation: Int): Bitmap {
    val bitmap = proxy.toBitmap()
    if (rotation == 0) {
      return bitmap
    }
    val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
    val uprightBmp = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (uprightBmp != bitmap) {
      bitmap.recycle()
    }

    return uprightBmp
  }

  private companion object {
    /** Максимум регионов детектора, прогоняемых через OCR за кадр */
    const val MAX_DETECTOR_REGIONS = 3
    const val DETECTOR_MIN_SCORE = 0.35f
    const val DETECTOR_NMS_IOU = 0.45f
    /** Расширение региона детектора перед OCR, доля от размеров региона */
    const val REGION_PADDING = 0.18
    const val MIN_REGION_SIZE_PX = 16
  }
}
