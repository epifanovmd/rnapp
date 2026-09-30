package com.margelo.nitro.visionengine

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.roundToInt

/**
 * Фасад nitro-спеки `VisionEngine`: реестр загруженных моделей и открытие
 * сессий кадра (`HybridFrameSession`). Логики распознавания здесь нет.
 *
 * Реестр — per-instance (у каждого сканера свой движок); сами
 * `TfliteDetector` кэшируются на всё приложение, поэтому слот модели ею
 * не владеет и не закрывает её. Запись — из async-контекста загрузки,
 * чтение — с frame-потока.
 */
@DoNotStrip
class HybridVisionEngine : HybridVisionEngineSpec() {
  private val models = ConcurrentHashMap<String, DetectorSlot>()

  override fun loadModel(config: DetectorModelConfig): Promise<DetectorModelInfo> {
    return Promise.async {
      val context = NitroModules.applicationContext ?: return@async NOT_LOADED
      val detector = TfliteDetector.load(
        context,
        "${config.name}.tflite",
        accelerator = config.accelerator ?: MODEL_DEFAULTS.accelerator,
        threads = config.threads?.roundToInt() ?: MODEL_DEFAULTS.threads,
      ) ?: return@async NOT_LOADED
      val slot = DetectorSlot(detector, config, MODEL_DEFAULTS)

      models[config.name] = slot
      slot.info
    }
  }

  override fun openFrame(frame: HybridFrameSpec): HybridFrameSessionSpec {
    val nativeFrame = frame as? NativeFrame
      ?: throw Error("VisionEngine: unexpected Frame implementation — expected VisionCamera NativeFrame")
    val proxy = nativeFrame.image

    return HybridFrameSession(proxy, proxy.imageInfo.rotationDegrees, HashMap(models))
  }

  private companion object {
    // Нативные фолбэки конфига модели; обязаны совпадать с `VISION_ENGINE_DEFAULTS`
    val MODEL_DEFAULTS = DetectorModelDefaults(
      resize = DetectorResizeMode.LETTERBOX,
      boxUnits = DetectorBoxUnits.AUTO,
      accelerator = DetectorAccelerator.CPU,
      threads = 0,
    )

    val NOT_LOADED = DetectorModelInfo(
      loaded = false,
      labels = emptyArray(),
      classCount = 0.0,
      inputWidth = 0.0,
      inputHeight = 0.0,
    )
  }
}
