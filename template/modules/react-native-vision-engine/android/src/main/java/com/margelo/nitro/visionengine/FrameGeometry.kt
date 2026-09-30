package com.margelo.nitro.visionengine

import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.Rect
import androidx.camera.core.ImageProxy
import kotlin.math.roundToInt

/** Кроп региона из выпрямленного кадра + его смещение в пикселях */
internal class RegionCrop(val bitmap: Bitmap, val left: Int, val top: Int)

/** Геометрия кадра: выпрямление, кропы регионов, нормализация координат */
internal object FrameGeometry {
  /** Bitmap кадра, повёрнутый в upright-ориентацию */
  fun uprightBitmap(proxy: ImageProxy, rotation: Int): Bitmap {
    val bitmap = proxy.toBitmap()
    if (rotation == 0) {
      return bitmap
    }
    val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
    val upright =
      Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (upright != bitmap) {
      bitmap.recycle()
    }

    return upright
  }

  /** Вырезать область с запасом; null — область слишком мала после обрезки */
  fun cropRegion(
    upright: Bitmap,
    rect: OcrRect,
    padding: Double,
    minSizePx: Int,
  ): RegionCrop? {
    val padX = rect.width * padding
    val padY = rect.height * padding
    val left = ((rect.x - padX) * upright.width).roundToInt().coerceAtLeast(0)
    val top = ((rect.y - padY) * upright.height).roundToInt().coerceAtLeast(0)
    val right = ((rect.x + rect.width + padX) * upright.width).roundToInt()
      .coerceAtMost(upright.width)
    val bottom = ((rect.y + rect.height + padY) * upright.height).roundToInt()
      .coerceAtMost(upright.height)
    if (right - left < minSizePx || bottom - top < minSizePx) {
      return null
    }

    return RegionCrop(
      bitmap = Bitmap.createBitmap(upright, left, top, right - left, bottom - top),
      left = left,
      top = top,
    )
  }

  /** Область — весь кадр без расширения: читается напрямую, без кропа */
  fun isFullFrame(rect: OcrRect, padding: Double): Boolean {
    return rect.x <= 0.0 && rect.y <= 0.0 && rect.width >= 1.0 && rect.height >= 1.0 && padding == 0.0
  }

  /** Координаты области внутри кропа → нормализованные координаты полного кадра */
  fun shiftRect(
    rect: OcrRect,
    crop: RegionCrop,
    imageWidth: Int,
    imageHeight: Int,
  ): OcrRect {
    return OcrRect(
      x = (crop.left + rect.x * crop.bitmap.width) / imageWidth,
      y = (crop.top + rect.y * crop.bitmap.height) / imageHeight,
      width = rect.width * crop.bitmap.width / imageWidth,
      height = rect.height * crop.bitmap.height / imageHeight,
    )
  }

  /** Пиксельный Rect → нормализованный top-left с обрезкой по границам */
  fun toNormalizedRect(rect: Rect, width: Int, height: Int): OcrRect {
    val x = (rect.left.toDouble() / width).coerceIn(0.0, 1.0)
    val y = (rect.top.toDouble() / height).coerceIn(0.0, 1.0)

    return OcrRect(
      x = x,
      y = y,
      width = (rect.width().toDouble() / width).coerceAtMost(1.0 - x),
      height = (rect.height().toDouble() / height).coerceAtMost(1.0 - y),
    )
  }
}
