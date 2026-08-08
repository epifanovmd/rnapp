package com.margelo.nitro.visionengine

import android.graphics.Bitmap
import android.os.SystemClock
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Фасад nitro-спеки `VisionEngine`: держит слоты моделей и оркеструет
 * сервисы (`MlKitTextRecognizer`, `TfliteDetector`, `FrameGeometry`).
 * Логики распознавания здесь нет. Все методы обработки синхронные —
 * вызываются с frame-потока VisionCamera (не main).
 */
@DoNotStrip
class HybridVisionEngine : HybridVisionEngineSpec() {
  /** Детектор регионов для наведения OCR (слот `loadDetector`) */
  private var detector: TfliteDetector? = null
  /** Модель детекции объектов (слот `loadObjectModel`) */
  private var objectDetector: TfliteDetector? = null

  override val isDetectorLoaded: Boolean
    get() = detector != null

  override val isObjectModelLoaded: Boolean
    get() = objectDetector != null

  override fun loadDetector(modelName: String): Promise<Boolean> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async false
      val loaded = TfliteDetector.load(context, "$modelName.tflite") ?: return@async false
      detector?.close()
      detector = loaded
      true
    }
  }

  override fun loadObjectModel(modelName: String): Promise<Boolean> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async false
      val loaded = TfliteDetector.load(context, "$modelName.tflite") ?: return@async false
      objectDetector?.close()
      objectDetector = loaded
      true
    }
  }

  // ─── Методы спеки ──────────────────────────────────────────────────────────

  override fun scan(frame: HybridFrameSpec, options: OcrScanOptions): OcrScanResult {
    return withFrame(frame) { context -> runOcr(context, options) }
  }

  override fun detectObjects(
    frame: HybridFrameSpec,
    options: ObjectScanOptions,
  ): ObjectScanResult {
    return withFrame(frame) { context -> runObjects(context, options) }
  }

  override fun analyze(frame: HybridFrameSpec, options: AnalyzeOptions): AnalyzeResult {
    return withFrame(frame) { context ->
      AnalyzeResult(
        ocr = options.ocr?.let { runOcr(context, it) },
        objects = options.objects?.let { runObjects(context, it) },
      )
    }
  }

  // ─── Конвейеры ─────────────────────────────────────────────────────────────

  /**
   * OCR кадра: с детектором — только по кропам его регионов, без детектора
   * или при пустых регионах — полный кадр через ML Kit.
   */
  private fun runOcr(context: FrameContext, options: OcrScanOptions): OcrScanResult {
    val start = SystemClock.elapsedRealtime()

    val detector = this.detector
    var regions: List<DetectedRegion> = emptyList()
    var observations: List<OcrObservation> = emptyList()
    if (detector != null) {
      // детектор наводит OCR на регионы интереса — читаем только кропы
      val upright = context.upright()

      regions = detector
        .detect(upright, minScore = DETECTOR_MIN_SCORE, iouThreshold = DETECTOR_NMS_IOU)
        .take(MAX_DETECTOR_REGIONS)
      observations = regions.flatMap { region ->
        val crop = FrameGeometry.cropRegion(
          upright,
          region,
          padding = REGION_PADDING,
          minSizePx = MIN_REGION_SIZE_PX,
        ) ?: return@flatMap emptyList()
        try {
          val text = MlKitTextRecognizer.recognize(crop.bitmap)
          MlKitTextRecognizer
            .toObservations(text, crop.bitmap.width, crop.bitmap.height, fromDetector = true)
            .map { observation ->
              OcrObservation(
                text = observation.text,
                confidence = observation.confidence,
                rect = FrameGeometry.shiftRect(
                  observation.rect,
                  crop,
                  context.imageWidth,
                  context.imageHeight,
                ),
                fromDetector = true,
              )
            }
        } finally {
          crop.bitmap.recycle()
        }
      }
    }
    // без детектора полный кадр — единственный режим; с детектором полный
    // кадр читается только при явном fullFrameFallback и пустых кропах
    val fallbackAllowed = options.fullFrameFallback ?: false
    if (detector == null || (observations.isEmpty() && fallbackAllowed)) {
      val mediaImage = context.proxy.image
        ?: throw Error("VisionEngine: Frame has no media Image — is it already disposed?")
      val text = MlKitTextRecognizer.recognize(mediaImage, context.rotation)
      observations = MlKitTextRecognizer
        .toObservations(text, context.imageWidth, context.imageHeight, fromDetector = false)
    }

    val filtered = observations
      .filter { it.confidence >= options.minConfidence }
      .sortedByDescending { it.confidence }
      .take(max(0, options.maxObservations.roundToInt()))

    return OcrScanResult(
      observations = filtered.toTypedArray(),
      regions = regions.map(::toDetectedObject).toTypedArray(),
      // ML Kit получает rotationDegrees и отдаёт боксы уже в выпрямленных
      // координатах — дополнительное преобразование не требуется
      bufferOrientation = OcrBufferOrientation.UP,
      imageWidth = context.imageWidth.toDouble(),
      imageHeight = context.imageHeight.toDouble(),
      durationMs = (SystemClock.elapsedRealtime() - start).toDouble(),
      detectorUsed = detector != null,
    )
  }

  /** Детекция объектов кадра моделью из слота `objectDetector` */
  private fun runObjects(context: FrameContext, options: ObjectScanOptions): ObjectScanResult {
    val start = SystemClock.elapsedRealtime()
    val objectDetector = this.objectDetector
      ?: throw Error("VisionEngine: object model is not loaded — call loadObjectModel() first")

    val objects = objectDetector
      .detect(
        context.upright(),
        minScore = options.minScore.toFloat(),
        iouThreshold = DETECTOR_NMS_IOU,
      )
      .take(max(0, options.maxObjects.roundToInt()))
      .map(::toDetectedObject)

    return ObjectScanResult(
      objects = objects.toTypedArray(),
      // детекция идёт по выпрямленному bitmap — координаты уже upright
      bufferOrientation = OcrBufferOrientation.UP,
      imageWidth = context.imageWidth.toDouble(),
      imageHeight = context.imageHeight.toDouble(),
      durationMs = (SystemClock.elapsedRealtime() - start).toDouble(),
    )
  }

  // ─── Кадр ──────────────────────────────────────────────────────────────────

  /**
   * Контекст одного кадра: выпрямленный bitmap считается лениво и один раз
   * на все конвейеры вызова (`analyze` делит его между OCR и объектами).
   */
  private class FrameContext(val proxy: ImageProxy, val rotation: Int) {
    val imageWidth: Int =
      if (rotation == 90 || rotation == 270) proxy.height else proxy.width
    val imageHeight: Int =
      if (rotation == 90 || rotation == 270) proxy.width else proxy.height

    private var uprightBitmap: Bitmap? = null

    fun upright(): Bitmap {
      return uprightBitmap
        ?: FrameGeometry.uprightBitmap(proxy, rotation).also { uprightBitmap = it }
    }

    fun release() {
      uprightBitmap?.recycle()
      uprightBitmap = null
    }
  }

  /** Frame VisionCamera → контекст обработки; upright-битмап освобождается после `block` */
  @OptIn(ExperimentalGetImage::class)
  private inline fun <T> withFrame(frame: HybridFrameSpec, block: (FrameContext) -> T): T {
    val nativeFrame = frame as? NativeFrame
      ?: throw Error("VisionEngine: unexpected Frame implementation — expected VisionCamera NativeFrame")
    val context = FrameContext(nativeFrame.image, nativeFrame.image.imageInfo.rotationDegrees)
    try {
      return block(context)
    } finally {
      context.release()
    }
  }

  /** Внутренняя детекция → `DetectedObject` контракта спеки (меток у TFLite нет) */
  private fun toDetectedObject(region: DetectedRegion): DetectedObject {
    return DetectedObject(
      classIndex = region.classIndex.toDouble(),
      label = "",
      score = region.score.toDouble(),
      rect = OcrRect(
        x = region.x.toDouble(),
        y = region.y.toDouble(),
        width = region.width.toDouble(),
        height = region.height.toDouble(),
      ),
    )
  }

  private companion object {
    /** Максимум регионов детектора, прогоняемых через OCR за кадр */
    const val MAX_DETECTOR_REGIONS = 3
    /** Порог уверенности детектора регионов OCR */
    const val DETECTOR_MIN_SCORE = 0.35f
    /** IoU-порог NMS детекций */
    const val DETECTOR_NMS_IOU = 0.45f
    /** Расширение региона детектора перед OCR, доля от размеров региона */
    const val REGION_PADDING = 0.18f
    /** Минимальный размер кропа, при котором OCR имеет смысл */
    const val MIN_REGION_SIZE_PX = 32
  }
}
