package com.margelo.nitro.visionengine

import android.graphics.Bitmap
import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

/**
 * OCR через ML Kit Text Recognition (латинская модель).
 * Синхронный: вызывается с frame-потока камеры (не main),
 * поэтому `Tasks.await` допустим.
 */
internal object MlKitTextRecognizer {
  /** Класс области, прочитанной полнокадровым OCR (детектор не участвовал) */
  const val FULL_FRAME_CLASS_INDEX = -1

  private val recognizer by lazy {
    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }

  /** Полный кадр: боксы вернутся в выпрямленных координатах (rotation учтён) */
  fun recognize(image: Image, rotationDegrees: Int): Text {
    return Tasks.await(recognizer.process(InputImage.fromMediaImage(image, rotationDegrees)))
  }

  /** Кроп (уже выпрямленный) */
  fun recognize(bitmap: Bitmap): Text {
    return Tasks.await(recognizer.process(InputImage.fromBitmap(bitmap, 0)))
  }

  /**
   * Строки ML Kit → области контракта модуля (нормализованный top-left).
   * `regionClassIndex` — класс региона детектора, из кропа которого читался
   * текст; `FULL_FRAME_CLASS_INDEX` для полнокадрового прохода.
   */
  fun toObservations(
    text: Text,
    width: Int,
    height: Int,
    regionClassIndex: Int,
  ): List<OcrObservation> {
    return text.textBlocks.flatMap { block -> block.lines }.mapNotNull { line ->
      val box = line.boundingBox ?: return@mapNotNull null
      OcrObservation(
        text = line.text,
        confidence = line.confidence.toDouble(),
        rect = FrameGeometry.toNormalizedRect(box, width, height),
        fromDetector = regionClassIndex != FULL_FRAME_CLASS_INDEX,
        regionClassIndex = regionClassIndex.toDouble(),
      )
    }
  }
}
