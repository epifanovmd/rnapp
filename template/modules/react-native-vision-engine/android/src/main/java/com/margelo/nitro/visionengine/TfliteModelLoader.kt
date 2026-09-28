package com.margelo.nitro.visionengine

import android.content.Context
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Загрузка TFLite-моделей из assets приложения */
internal object TfliteModelLoader {
  /** null — модель не найдена; ошибки формата бросаются конструктором Interpreter */
  fun load(context: Context, assetName: String): Interpreter? {
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
    val options = Interpreter.Options().apply {
      numThreads = Runtime.getRuntime().availableProcessors().coerceIn(2, 4)
    }

    return Interpreter(model, options)
  }
}
