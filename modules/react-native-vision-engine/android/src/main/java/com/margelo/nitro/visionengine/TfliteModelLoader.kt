package com.margelo.nitro.visionengine

import android.content.Context
import android.util.Log
import org.tensorflow.lite.Delegate
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import org.tensorflow.lite.nnapi.NnApiDelegate
import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Загруженная TFLite-модель: интерпретатор, делегат и имена классов из метаданных */
internal class TfliteModel(
  val interpreter: Interpreter,
  /** Имена классов из метаданных модели; пусто — модель их не содержит */
  val labels: List<String>,
  /** Фактический вычислитель: при недоступном делегате — CPU */
  val accelerator: DetectorAccelerator,
  /** Делегат живёт столько же, сколько интерпретатор, который его использует */
  private val delegate: Delegate?,
)

/** Загрузка TFLite-моделей из assets приложения */
internal object TfliteModelLoader {
  private const val TAG = "VisionEngine"

  /**
   * null — модель не найдена; ошибки формата бросаются конструктором
   * Interpreter. Делегат, который не создался или не принял граф модели,
   * заменяется CPU-инференсом.
   */
  fun load(
    context: Context,
    assetName: String,
    accelerator: DetectorAccelerator,
    threads: Int,
  ): TfliteModel? {
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
    val labels = ModelMetadata.labels(bytes)
    val cpuThreads = if (threads > 0) threads else Runtime.getRuntime().availableProcessors().coerceIn(2, 4)

    if (accelerator != DetectorAccelerator.CPU) {
      val delegate = createDelegate(accelerator)
      if (delegate != null) {
        try {
          val options = Interpreter.Options().apply {
            numThreads = cpuThreads
            addDelegate(delegate)
          }
          return TfliteModel(Interpreter(model, options), labels, accelerator, delegate)
        } catch (error: Exception) {
          Log.w(TAG, "$assetName: $accelerator delegate rejected the model, falling back to CPU", error)
          delegate.close()
          model.rewind()
        }
      }
    }

    val options = Interpreter.Options().apply { numThreads = cpuThreads }

    return TfliteModel(Interpreter(model, options), labels, DetectorAccelerator.CPU, null)
  }

  /** null — делегат на устройстве недоступен */
  private fun createDelegate(accelerator: DetectorAccelerator): Delegate? {
    return try {
      when (accelerator) {
        DetectorAccelerator.GPU -> {
          val compatibility = CompatibilityList()
          try {
            if (compatibility.isDelegateSupportedOnThisDevice) {
              GpuDelegate(compatibility.bestOptionsForThisDevice)
            } else {
              null
            }
          } finally {
            compatibility.close()
          }
        }
        DetectorAccelerator.NNAPI -> NnApiDelegate()
        DetectorAccelerator.CPU -> null
      }
    } catch (error: Throwable) {
      Log.w(TAG, "$accelerator delegate is unavailable, falling back to CPU", error)
      null
    }
  }
}
