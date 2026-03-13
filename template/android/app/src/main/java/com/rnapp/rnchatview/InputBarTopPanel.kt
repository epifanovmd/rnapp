package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.rnapp.rnchatview.ChatLayoutConstants as C

private const val TAG = "InputBarTopPanel"

/**
 * Верхняя панель инпут-бара — показывается в режиме Reply и Edit.
 *
 * ┌─────────────────────────────────────────┐
 * │ ▎  Sender Name / "Edit Message"   [ ✕ ] │
 * │ ▎  preview text…                        │
 * └─────────────────────────────────────────┘
 *
 * Панель не знает об анимации — только отображает данные и сигнализирует
 * о нажатии «закрыть» через [onCloseClick]. Всей анимацией управляет InputBarView.
 */
internal class InputBarTopPanel(
    context: Context,
    private val onCloseClick: () -> Unit,
) : LinearLayout(context) {

    // ── Views ─────────────────────────────────────────────────────────────────

    /** Цветная вертикальная полоса слева. Цвет из [ChatTheme.replyPanelAccent]. */
    private val accentBar = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dp(2f).toFloat()
            setColor(Color.rgb(0, 122, 255))
        }
    }

    /** Вертикальный контейнер заголовка и превью. Занимает всё свободное место (weight=1). */
    private val textsContainer = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
    }

    /**
     * Заголовок: имя отправителя (Reply) или "Edit Message" (Edit).
     * Обрезается в одну строку с многоточием.
     */
    private val titleView = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    /**
     * Превью: текст сообщения (Reply) или оригинальный текст (Edit).
     * Если текста нет, но есть фото — "📷 Photo".
     */
    private val previewView = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    /** Кнопка «✕» — закрыть панель. Вызывает [onCloseClick]. */
    private val closeButton = ImageView(context).apply {
        setImageDrawable(CloseCircleDrawable())
        isClickable = true
        isFocusable = true
        background = context.selectableItemBgBorderless()
        contentDescription = "Cancel"
        setOnClickListener {
            Log.d(TAG, "closeButton clicked")
            onCloseClick()
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(12f), 0, dp(8f), 0)
        visibility = View.GONE // скрыта до первого beginReply/beginEdit

        textsContainer.addView(titleView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        textsContainer.addView(previewView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
            it.topMargin = dp(2f)
        })

        addView(accentBar, LayoutParams(dp(C.REPLY_BAR_WIDTH_DP), dp(32f)).also { it.marginEnd = dp(10f) })
        addView(textsContainer, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        addView(closeButton, LayoutParams(dp(24f), dp(24f)))

        // Следим за изменением собственной высоты — если панель не растёт после VISIBLE,
        // значит proблема в измерении или в данных
        addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            val newH = bottom - top
            val oldH = oldBottom - oldTop
            if (newH != oldH) {
                Log.d(TAG, "layoutChanged: ${oldH}px → ${newH}px | " +
                    "visibility=${visibility.visName()} | " +
                    "title='${titleView.text}' preview='${previewView.text?.toString()?.take(30)}'")
            }
        }

        Log.d(TAG, "init done: visibility=${visibility.visName()}")
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Заполняет панель данными для режима ответа.
     * Если [ReplyInfo.snapshotText] пустой но есть фото — показывает "📷 Photo".
     */
    fun bindReply(info: ReplyInfo) {
        val title = info.snapshotSenderName ?: "Message"
        val preview = info.snapshotText ?: if (info.snapshotHasImage) "📷 Photo" else ""
        Log.d(TAG, "bindReply: title='$title' preview='$preview' | " +
            "visibility=${visibility.visName()} isAttachedToWindow=$isAttachedToWindow | " +
            "titleView.text was='${titleView.text}' previewView.text was='${previewView.text}'")
        titleView.text   = title
        previewView.text = preview
        Log.d(TAG, "bindReply done: titleView='${titleView.text}' previewView='${previewView.text}'")
    }

    /**
     * Заполняет панель данными для режима редактирования.
     * Заголовок фиксирован "Edit Message", превью — оригинальный текст.
     */
    fun bindEdit(originalText: String) {
        Log.d(TAG, "bindEdit: originalText='${originalText.take(40)}' | " +
            "visibility=${visibility.visName()} isAttachedToWindow=$isAttachedToWindow | " +
            "titleView.text was='${titleView.text}'")
        titleView.text   = "Edit Message"
        previewView.text = originalText
        Log.d(TAG, "bindEdit done: titleView='${titleView.text}' previewView='${previewView.text?.toString()?.take(40)}'")
    }

    /**
     * Применяет цвета темы ко всем элементам панели.
     * Вызывается из [InputBarView.applyTheme].
     */
    fun applyTheme(theme: ChatTheme) {
        Log.d(TAG, "applyTheme: isDark=${theme.isDark}")
        (accentBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        titleView.setTextColor(theme.replyPanelSender)
        previewView.setTextColor(theme.replyPanelText)
        (closeButton.drawable as? CloseCircleDrawable)?.circleColor = theme.replyPanelClose
    }

    // ── onMeasure / onLayout — диагностика нулевой высоты панели ─────────────

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        // Если measuredHeight=0 при VISIBLE — проблема в измерении или дочерних вью
        Log.v(TAG, "onMeasure: vis=${visibility.visName()} → measH=$measuredHeight measW=$measuredWidth | " +
            "lp.h=${layoutParams?.height?.lpName()} | " +
            "titleView.measH=${titleView.measuredHeight} previewView.measH=${previewView.measuredHeight}")
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        if (changed) {
            Log.d(TAG, "onLayout: h=${b - t} | " +
                "accentBar=[t=${accentBar.top} h=${accentBar.height}] | " +
                "textsContainer=[t=${textsContainer.top} h=${textsContainer.height}] | " +
                "closeButton=[t=${closeButton.top} h=${closeButton.height}]")
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun dp(v: Float) = context.dpToPx(v)
    private fun lp(w: Int, h: Int, weight: Float = 0f) = LayoutParams(w, h, weight)
}

// ── Extensions ────────────────────────────────────────────────────────────────

/** Возвращает стандартный borderless ripple — для кнопок без явного фона. */
internal fun Context.selectableItemBgBorderless(): android.graphics.drawable.Drawable? {
    val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
    return ta.getDrawable(0).also { ta.recycle() }
}

private fun Int.visName() = when (this) {
    View.VISIBLE   -> "VISIBLE"
    View.INVISIBLE -> "INVISIBLE"
    View.GONE      -> "GONE"
    else           -> "UNKNOWN($this)"
}

private fun Int.lpName() = when (this) {
    android.view.ViewGroup.LayoutParams.MATCH_PARENT -> "MATCH"
    android.view.ViewGroup.LayoutParams.WRAP_CONTENT -> "WRAP"
    else -> "${this}px"
}
