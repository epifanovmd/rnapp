package com.margelo.nitro.visionengine

import android.graphics.Bitmap

/**
 * Загруженная модель движка: разделяемая модель плюс способ её прогона из
 * конфига (имена классов, подача кадра, единицы координат).
 */
internal class DetectorSlot(
  private val detector: TfliteDetector,
  config: DetectorModelConfig,
  defaults: DetectorModelDefaults,
) {
  /** Имена классов: из конфига, иначе из метаданных модели */
  val labels: List<String> =
    config.labels?.takeIf { it.isNotEmpty() }?.toList() ?: detector.labels
  private val resize: DetectorResizeMode = config.resize ?: defaults.resize
  private val boxUnits: DetectorBoxUnits = config.boxUnits ?: defaults.boxUnits

  /** Описание модели для JS */
  val info: DetectorModelInfo
    get() = DetectorModelInfo(
      loaded = true,
      labels = labels.toTypedArray(),
      classCount = (if (labels.isEmpty()) detector.outputClassCount else labels.size).toDouble(),
      inputWidth = detector.inputWidth.toDouble(),
      inputHeight = detector.inputHeight.toDouble(),
    )

  /** Детекции выпрямленного кадра с именами классов */
  fun detect(upright: Bitmap, minScore: Float, iouThreshold: Float): List<DetectedRegion> {
    return detector
      .detect(upright, resize, boxUnits, minScore, iouThreshold)
      .map { it.copy(label = labels.getOrElse(it.classIndex) { "" }) }
  }
}

/** Нативные фолбэки конфига модели; обязаны совпадать с `DETECTOR_DEFAULTS` */
internal data class DetectorModelDefaults(
  val resize: DetectorResizeMode,
  val boxUnits: DetectorBoxUnits,
  val accelerator: DetectorAccelerator,
  val threads: Int,
)
