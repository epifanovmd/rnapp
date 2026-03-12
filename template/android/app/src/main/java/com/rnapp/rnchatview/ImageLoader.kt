package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.os.Handler
import android.os.Looper
import android.widget.ImageView
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Collections
import java.util.WeakHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.Future

object ImageLoader {

    private val executor: ExecutorService = Executors.newFixedThreadPool(4)
    private val mainHandler = Handler(Looper.getMainLooper())

    private val futures: MutableMap<ImageView, Future<*>> =
        Collections.synchronizedMap(WeakHashMap())

    private val cache = object : LinkedHashMap<String, Bitmap>(64, 0.75f, true) {
        private val MAX_SIZE = 40
        override fun removeEldestEntry(eldest: Map.Entry<String, Bitmap>?) = size > MAX_SIZE
    }

    /**
     * Загружает изображение по URL в ImageView.
     * Предыдущая задача для того же view отменяется автоматически.
     */
    fun load(
        context: Context,
        url: String,
        target: ImageView,
        cornerRadius: Int = 0,
        targetW: Int = 0,
        targetH: Int = 0,
    ) {
        val cacheKey = "$url-${targetW}x$targetH"
        synchronized(cache) { cache[cacheKey] }?.let { bitmap ->
            target.setImageDrawable(buildDrawable(context, bitmap, cornerRadius))
            return
        }

        cancel(target)
        target.tag = url

        val future = executor.submit {
            val bitmap = try { fetchBitmap(url, targetW, targetH) } catch (_: Exception) { null }
            bitmap?.let { synchronized(cache) { cache[cacheKey] = it } }
            mainHandler.post {
                if (target.tag == url && bitmap != null) {
                    target.setImageDrawable(buildDrawable(context, bitmap, cornerRadius))
                }
            }
        }
        futures[target] = future
    }

    /** Отменяет текущую загрузку для указанного ImageView. */
    fun cancel(target: ImageView) {
        futures.remove(target)?.cancel(false)
        target.tag = null
    }

    private fun fetchBitmap(url: String, targetW: Int, targetH: Int): Bitmap? {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 10_000
            readTimeout = 15_000
            doInput = true
        }
        return try {
            conn.connect()
            if (conn.responseCode != HttpURLConnection.HTTP_OK) return null
            val stream: InputStream = conn.inputStream

            if (targetW > 0 && targetH > 0) {
                val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeStream(stream, null, opts)
                stream.close()
                conn.disconnect()

                val conn2 = (URL(url).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 10_000; readTimeout = 15_000; doInput = true
                }
                conn2.connect()
                val decodeOpts = BitmapFactory.Options().apply {
                    inSampleSize = calculateSampleSize(opts.outWidth, opts.outHeight, targetW, targetH)
                }
                BitmapFactory.decodeStream(conn2.inputStream, null, decodeOpts).also { conn2.disconnect() }
            } else {
                BitmapFactory.decodeStream(stream).also { conn.disconnect() }
            }
        } catch (e: Exception) {
            conn.disconnect()
            null
        }
    }

    private fun calculateSampleSize(w: Int, h: Int, targetW: Int, targetH: Int): Int {
        var sample = 1
        if (w > targetW || h > targetH) {
            while ((w / sample) >= targetW * 2 && (h / sample) >= targetH * 2) sample *= 2
        }
        return sample
    }

    private fun buildDrawable(context: Context, bitmap: Bitmap, cornerRadius: Int): android.graphics.drawable.Drawable {
        if (cornerRadius <= 0) return BitmapDrawable(context.resources, bitmap)
        return androidx.core.graphics.drawable.RoundedBitmapDrawableFactory
            .create(context.resources, bitmap).apply {
                this.cornerRadius = cornerRadius.toFloat()
                isCircular = false
            }
    }
}
