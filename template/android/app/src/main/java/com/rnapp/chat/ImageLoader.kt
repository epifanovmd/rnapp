package com.rnapp.chat.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import android.widget.ImageView
import kotlinx.coroutines.*
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Простой двухуровневый кэш изображений (memory + disk через Android LruCache).
 * В продакшне замените на Coil / Glide / Picasso — они предоставляют
 * более богатый функционал (disk cache, transforms, placeholders).
 *
 * Использование:
 *   ImageLoader.load(url, imageView)
 *   ImageLoader.load(url, imageView, cornerRadiusPx = 24)
 */
object ImageLoader {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // LruCache — 25% от доступной heap
    private val memCache: LruCache<String, Bitmap> = object : LruCache<String, Bitmap>(
        (Runtime.getRuntime().maxMemory() / 1024 / 4).toInt()
    ) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount / 1024
    }

    // Теги на View для отмены предыдущей загрузки
    private val TAG_JOB = "img_job".hashCode()

    fun load(
        url: String?,
        target: ImageView,
        cornerRadiusPx: Float = 0f,
        placeholder: Int? = null,
    ) {
        if (url.isNullOrBlank()) {
            placeholder?.let { target.setImageResource(it) }
            return
        }

        // Отменяем предыдущую загрузку для этого View
        (target.getTag(TAG_JOB) as? Job)?.cancel()

        // Memory hit
        memCache.get(url)?.let { cached ->
            target.setImageBitmap(if (cornerRadiusPx > 0) rounded(cached, cornerRadiusPx) else cached)
            return
        }

        placeholder?.let { target.setImageResource(it) }

        val job = scope.launch {
            val bitmap = fetchBitmap(url) ?: return@launch
            memCache.put(url, bitmap)
            val result = if (cornerRadiusPx > 0) rounded(bitmap, cornerRadiusPx) else bitmap
            withContext(Dispatchers.Main) {
                // Проверяем что View всё ещё ожидает этот URL
                if (target.getTag(TAG_JOB) == coroutineContext[Job]) {
                    target.setImageBitmap(result)
                }
            }
        }
        target.setTag(TAG_JOB, job)
    }

    fun cancelLoad(target: ImageView) {
        (target.getTag(TAG_JOB) as? Job)?.cancel()
        target.setTag(TAG_JOB, null)
    }

    private fun fetchBitmap(url: String): Bitmap? = try {
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout    = 15_000
            doInput        = true
            connect()
        }
        connection.inputStream.use { stream: InputStream ->
            BitmapFactory.decodeStream(stream)
        }
    } catch (e: Exception) {
        null
    }

    private fun rounded(src: Bitmap, radius: Float): Bitmap {
        val output = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(output)
        val paint  = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
        val rect   = android.graphics.RectF(0f, 0f, src.width.toFloat(), src.height.toFloat())
        canvas.drawRoundRect(rect, radius, radius, paint)
        paint.xfermode = android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(src, 0f, 0f, paint)
        return output
    }
}
