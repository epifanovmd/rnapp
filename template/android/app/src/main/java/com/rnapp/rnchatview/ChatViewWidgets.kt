package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import com.rnapp.rnchatview.ChatLayoutConstants as C

class EmptyStateView(context: Context) : FrameLayout(context) {

    private val label = TextView(context)
    private val spinner = android.widget.ProgressBar(context)

    init {
        label.text = "No messages yet.\nBe the first! 👋"
        label.gravity = Gravity.CENTER
        label.textSize = 16f
        addView(label, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        addView(spinner, LayoutParams(context.dpToPx(40f), context.dpToPx(40f), Gravity.CENTER))
    }

    /** Сдвигает вью вверх на высоту inputBar + keyboard чтобы оставаться по центру видимой области. */
    fun setBottomOffset(offsetPx: Int) {
        (label.layoutParams as LayoutParams).bottomMargin = offsetPx; label.requestLayout()
        (spinner.layoutParams as LayoutParams).bottomMargin = offsetPx; spinner.requestLayout()
    }

    /** Переключает отображение между спиннером загрузки и пустым текстом. */
    fun setLoading(loading: Boolean) {
        label.visibility = if (loading) View.INVISIBLE else View.VISIBLE
        spinner.visibility = if (loading) View.VISIBLE else View.GONE
    }

    /** Применяет цвет текста из темы. */
    fun applyTheme(theme: ChatTheme) = label.setTextColor(theme.emptyStateText)
}

class FabButton(context: Context) : FrameLayout(context) {

    private val arrowIcon = ImageView(context).apply {
        setImageDrawable(DownArrowDrawable())
        scaleType = ImageView.ScaleType.CENTER_INSIDE
    }

    init {
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
        elevation = context.dpToPx(C.FAB_ELEVATION_DP).toFloat()
        scaleX = 0.7f; scaleY = 0.7f
        isClickable = true; isFocusable = true
        val iconSize = context.dpToPx(22f)
        addView(arrowIcon, LayoutParams(iconSize, iconSize, Gravity.CENTER))
    }

    /** Применяет цвета фона и иконки из темы. */
    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        (arrowIcon.drawable as? DownArrowDrawable)?.iconColor = theme.fabArrowColor
    }
}

private class DownArrowDrawable : Drawable() {
    var iconColor: Int = Color.rgb(120, 120, 128)
        set(v) { field = v; paint.color = v; invalidateSelf() }
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(120, 120, 128)
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat(); val h = bounds.height().toFloat()
        val cx = w / 2f; val cy = h / 2f
        paint.strokeWidth = w * 0.12f
        val top = cy - h * 0.22f; val bot = cy + h * 0.22f; val wing = w * 0.18f
        // Vertical line from top to bottom
        c.drawLine(cx, top, cx, bot, paint)
        // Arrow wings pointing down
        c.drawLine(cx, bot, cx - wing, bot - wing, paint)
        c.drawLine(cx, bot, cx + wing, bot - wing, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
