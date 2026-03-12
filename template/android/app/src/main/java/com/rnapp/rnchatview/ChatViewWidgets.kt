package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
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

    init {
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
        elevation = context.dpToPx(C.FAB_ELEVATION_DP).toFloat()
        scaleX = 0.7f; scaleY = 0.7f
        isClickable = true; isFocusable = true
        addView(TextView(context).apply {
            text = "↓"; textSize = 18f; gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        })
    }

    /** Применяет цвета фона и иконки из темы. */
    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        (getChildAt(0) as? TextView)?.setTextColor(theme.fabArrowColor)
    }
}
