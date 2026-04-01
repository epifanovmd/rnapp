package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable

/**
 * Microphone icon drawable for the voice recording button.
 * Telegram-style mic icon, drawn programmatically.
 */
class MicDrawable(context: Context) : Drawable() {

    var color: Int = 0xFF999999.toInt()
        set(value) {
            field = value
            paint.color = value
            invalidateSelf()
        }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = this@MicDrawable.color
    }

    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = context.resources.displayMetrics.density * 1.8f
        strokeCap = Paint.Cap.ROUND
        color = this@MicDrawable.color
    }

    override fun draw(canvas: Canvas) {
        val b = bounds
        val cx = b.exactCenterX()
        val cy = b.exactCenterY()
        val w = b.width().toFloat()
        val h = b.height().toFloat()
        val scale = minOf(w, h) / 24f

        paint.color = color
        strokePaint.color = color

        // Mic body (rounded rect)
        val bodyW = 8f * scale
        val bodyH = 12f * scale
        val bodyLeft = cx - bodyW / 2
        val bodyTop = cy - h * 0.35f
        val bodyRect = RectF(bodyLeft, bodyTop, bodyLeft + bodyW, bodyTop + bodyH)
        canvas.drawRoundRect(bodyRect, bodyW / 2, bodyW / 2, paint)

        // Mic arc (U shape around body)
        val arcW = 12f * scale
        val arcH = 14f * scale
        val arcLeft = cx - arcW / 2
        val arcTop = bodyTop - 1f * scale
        val arcRect = RectF(arcLeft, arcTop, arcLeft + arcW, arcTop + arcH)
        canvas.drawArc(arcRect, 0f, 180f, false, strokePaint)

        // Stem (vertical line from arc bottom to base)
        val stemTop = arcTop + arcH / 2
        val stemBottom = stemTop + 3f * scale
        canvas.drawLine(cx, stemTop, cx, stemBottom, strokePaint)

        // Base (horizontal line)
        val baseY = stemBottom
        val baseHalf = 3f * scale
        canvas.drawLine(cx - baseHalf, baseY, cx + baseHalf, baseY, strokePaint)
    }

    override fun setAlpha(alpha: Int) {
        paint.alpha = alpha
        strokePaint.alpha = alpha
    }

    override fun setColorFilter(colorFilter: ColorFilter?) {
        paint.colorFilter = colorFilter
        strokePaint.colorFilter = colorFilter
    }

    @Suppress("OVERRIDE_DEPRECATION")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
}
