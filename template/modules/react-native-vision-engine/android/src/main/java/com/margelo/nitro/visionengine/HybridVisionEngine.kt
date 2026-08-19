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
 *
 * Слоты моделей — per-instance (у каждого сканера свой движок); сами
 * `TfliteDetector` кэшируются по имени на всё приложение, поэтому слот
 * не владеет моделью и не закрывает её. Запись слота — из async-контекста
 * загрузки, чтение — с frame-потока (`@Volatile`).
 */
@DoNotStrip
class HybridVisionEngine : HybridVisionEngineSpec() {
  /** Детектор регионов для наведения OCR (слот `loadDetector`) */
  @Volatile
  private var detector: TfliteDetector? = null
  /** Модель детекции объектов (слот `loadObjectModel`) */
  @Volatile
  private var objectDetector: TfliteDetector? = null

  override val isDetectorLoaded: Boolean
    get() = detector != null

  override val isObjectModelLoaded: Boolean
    get() = objectDetector != null

  override fun loadDetector(modelName: String): Promise<Boolean> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async false
      val loaded = TfliteDetector.load(context, "$modelName.tflite") ?: return@async false
      detector = loaded
      true
    }
  }

  override fun loadObjectModel(modelName: String): Promise<Boolean> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async false
      val loaded = TfliteDetector.load(context, "$modelName.tflite") ?: return@async false
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
      val regionPadding = (options.regionPadding ?: DEFAULT_REGION_PADDING).toFloat()

      regions = selectRegions(
        detector.detect(
          upright,
          minScore = (options.regionMinScore ?: DEFAULT_REGION_MIN_SCORE).toFloat(),
          iouThreshold = (options.regionIouThreshold ?: DEFAULT_NMS_IOU).toFloat(),
        ),
        options,
      )
      observations = regions.flatMap { region ->
        val crop = FrameGeometry.cropRegion(
          upright,
          region,
          padding = regionPadding,
          minSizePx = MIN_REGION_SIZE_PX,
        ) ?: return@flatMap emptyList()
        try {
          val text = MlKitTextRecognizer.recognize(crop.bitmap)
          MlKitTextRecognizer
            .toObservations(
              text,
              crop.bitmap.width,
              crop.bitmap.height,
              regionClassIndex = region.classIndex,
            )
            .map { observation ->
              observation.copy(
                rect = FrameGeometry.shiftRect(
                  observation.rect,
                  crop,
                  context.imageWidth,
                  context.imageHeight,
                ),
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
      observations = MlKitTextRecognizer.toObservations(
        text,
        context.imageWidth,
        context.imageHeight,
        regionClassIndex = MlKitTextRecognizer.FULL_FRAME_CLASS_INDEX,
      )
    }

    val filtered = limitObservations(
      observations
        .filter { it.confidence >= options.minConfidence }
        .sortedByDescending { it.confidence },
      max(0, options.maxObservations.roundToInt()),
    )

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
        iouThreshold = (options.iouThreshold ?: DEFAULT_NMS_IOU).toFloat(),
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

  /**
   * Обрезка до лимита по кругу между регионами: строк таблички кратно больше,
   * чем у номера, и глобальный top-N по уверенности вытеснил бы малые регионы
   * целиком. Внутри региона порядок по уверенности сохраняется.
   */
  private fun limitObservations(
    observations: List<OcrObservation>,
    limit: Int,
  ): List<OcrObservation> {
    if (observations.size <= limit) {
      return observations
    }

    val groups = LinkedHashMap<Double, MutableList<OcrObservation>>()
    for (observation in observations) {
      groups.getOrPut(observation.regionClassIndex) { ArrayList() }.add(observation)
    }

    val result = ArrayList<OcrObservation>(limit)
    var index = 0
    while (result.size < limit) {
      var appended = false
      for (group in groups.values) {
        if (index >= group.size) {
          continue
        }
        result.add(group[index])
        appended = true
        if (result.size >= limit) {
          break
        }
      }
      if (!appended) {
        break
      }
      index++
    }

    return result
  }

  /**
   * Регионы детектора → те, что уходят в OCR: фильтр по разрешённым классам,
   * затем квота на класс и общий лимит. Детекции приходят отсортированными
   * по score, порядок сохраняется.
   */
  private fun selectRegions(
    detections: List<DetectedRegion>,
    options: OcrScanOptions,
  ): List<DetectedRegion> {
    val maxRegions = max(0, (options.maxRegions ?: DEFAULT_MAX_REGIONS).roundToInt())
    val perClassLimit = (options.maxRegionsPerClass ?: DEFAULT_MAX_REGIONS_PER_CLASS).roundToInt()
    val maxPerClass = if (perClassLimit > 0) perClassLimit else Int.MAX_VALUE
    val allowed = options.regionClasses
      ?.takeIf { it.isNotEmpty() }
      ?.map { it.roundToInt() }
      ?.toSet()

    val counts = HashMap<Int, Int>()
    val selected = ArrayList<DetectedRegion>(maxRegions)
    for (detection in detections) {
      if (selected.size >= maxRegions) {
        break
      }
      if (allowed != null && detection.classIndex !in allowed) {
        continue
      }
      val used = counts[detection.classIndex] ?: 0
      if (used >= maxPerClass) {
        continue
      }
      counts[detection.classIndex] = used + 1
      selected.add(detection)
    }

    return selected
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
    // Фолбэки порогов детектора для вызовов без соответствующих полей
    // опций; обязаны совпадать с `DETECTOR_DEFAULTS` JS-модуля
    // (рантайм-источник — значения, переданные в опциях)
    const val DEFAULT_REGION_MIN_SCORE = 0.35
    const val DEFAULT_MAX_REGIONS = 6.0
    const val DEFAULT_MAX_REGIONS_PER_CLASS = 2.0
    const val DEFAULT_REGION_PADDING = 0.18
    const val DEFAULT_NMS_IOU = 0.45

    /** Минимальный размер кропа, при котором OCR имеет смысл */
    const val MIN_REGION_SIZE_PX = 32
  }
}
