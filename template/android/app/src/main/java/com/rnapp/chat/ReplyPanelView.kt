package com.rnapp.chat.inputbar

import android.animation.ValueAnimator
import android.content.Context
import android.view.Gravity
import android.view.View
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.*
import com.rnapp.chat.model.ChatInputAction
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx

/**
 * ReplyPanelView — панель цитаты/редактирования.
 *
 * Живёт в ChatView (FrameLayout) с Gravity.BOTTOM.
 * bottomMargin выставляется равным высоте InputBarView — панель всегда рендерится
 * строго над ним в layout-координатах.
 *
 * Анимация — ValueAnimator высоты от 0 до panelHeightPx.
 * Никакого translationY — высота меняется реально, что заставляет ChatView
 * сдвигать inputBar через его translationY на каждом кадре.
 *
 * onHeightChanged(currentHeight) — коллбек на каждый кадр анимации.
 * ChatView использует его чтобы:
 *   1. Сдвинуть inputBar вверх: inputBar.translationY = -(keyboardH + panelH)
 *   2. Обновить paddingBottom RecyclerView: inputBarH + panelH + keyboardH
 */
class ReplyPanelView(context: Context) : LinearLayout(context) {

    var onCancelAction: (() -> Unit)? = null
    /** Вызывается на каждом кадре анимации — currentHeight: 0..panelHeightPx */
    var onHeightChanged: ((currentHeight: Int) -> Unit)? = null

    private val accentLine: View
    private val senderLabel: TextView
    private val bodyLabel: TextView
    private val closeButton: ImageButton

    private var currentTheme: ChatTheme = ChatTheme.light
    private var isPanelShown = false
    private var animator: ValueAnimator? = null

    val panelHeightPx: Int

    init {
        orientation = HORIZONTAL
        gravity     = Gravity.CENTER_VERTICAL

        fun dp(v: Float): Int = v.dpToPx(context)

        panelHeightPx = dp(ChatLayoutConstants.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

        val hPad = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)
        setPadding(hPad, 0, hPad, 0)

        accentLine = View(context).apply {
            layoutParams = LayoutParams(dp(ChatLayoutConstants.REPLY_ACCENT_WIDTH_DP), LayoutParams.MATCH_PARENT)
        }

        senderLabel = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_SENDER_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        bodyLabel = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        val texts = LinearLayout(context).apply {
            orientation  = VERTICAL
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply { marginStart = dp(8f) }
            addView(senderLabel)
            addView(bodyLabel)
        }

        closeButton = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            background = null
            val s = dp(32f)
            layoutParams = LayoutParams(s, LayoutParams.MATCH_PARENT)
            setPadding(dp(4f), 0, dp(8f), 0)
            setOnClickListener { onCancelAction?.invoke() }
        }

        addView(accentLine)
        addView(texts)
        addView(closeButton)

        // Изначально скрыта — высота 0
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 0).also {
            (it as? android.widget.FrameLayout.LayoutParams)?.gravity = Gravity.BOTTOM
        }
        visibility = View.GONE

        applyTheme(currentTheme)
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    fun applyTheme(theme: ChatTheme) {
        currentTheme = theme
        setBackgroundColor(theme.replyPanelBackground)
        accentLine.setBackgroundColor(theme.replyPanelAccent)
        senderLabel.setTextColor(theme.replyPanelSender)
        bodyLabel.setTextColor(theme.replyPanelText)
        closeButton.setColorFilter(theme.replyPanelClose)
    }

    fun setInputAction(action: ChatInputAction?, messages: List<ChatMessage>) {
        when (action?.type) {
            "reply" -> {
                val msg = messages.find { it.id == action.messageId }
                senderLabel.text = msg?.senderName?.takeIf { it.isNotBlank() } ?: "Reply"
                senderLabel.setTextColor(currentTheme.replyPanelSender)
                bodyLabel.text = when {
                    !msg?.text.isNullOrBlank()        -> msg!!.text!!
                    msg?.images?.isNotEmpty() == true -> "📷 Photo"
                    else                              -> ""
                }
                animatePanel(show = true)
            }
            "edit" -> {
                val msg = messages.find { it.id == action.messageId }
                senderLabel.text = "Edit message"
                senderLabel.setTextColor(currentTheme.inputBarTint)
                bodyLabel.text = msg?.text ?: ""
                animatePanel(show = true)
            }
            else -> animatePanel(show = false)
        }
    }

    fun refreshIfNeeded(action: ChatInputAction?, messages: List<ChatMessage>) {
        action ?: return
        when (action.type) {
            "reply" -> {
                val msg = messages.find { it.id == action.messageId } ?: return
                val newSender = msg.senderName?.takeIf { it.isNotBlank() } ?: "Reply"
                val newBody = when {
                    !msg.text.isNullOrBlank()        -> msg.text!!
                    msg.images?.isNotEmpty() == true -> "📷 Photo"
                    else                             -> ""
                }
                if (senderLabel.text != newSender) senderLabel.text = newSender
                if (bodyLabel.text != newBody) bodyLabel.text = newBody
            }
            "edit" -> {
                val msg = messages.find { it.id == action.messageId } ?: return
                if (bodyLabel.text != msg.text) bodyLabel.text = msg.text ?: ""
            }
        }
    }

    fun currentHeight(): Int = layoutParams?.height?.coerceAtLeast(0) ?: 0

    // ─── Animation ────────────────────────────────────────────────────────────

    private fun animatePanel(show: Boolean) {
        if (isPanelShown == show) return
        isPanelShown = show

        animator?.cancel()

        val startH = currentHeight()
        val endH   = if (show) panelHeightPx else 0

        if (show) visibility = View.VISIBLE

        animator = ValueAnimator.ofInt(startH, endH).apply {
            duration     = if (show) 220L else 180L
            interpolator = if (show) DecelerateInterpolator() else AccelerateInterpolator()
            addUpdateListener { anim ->
                val h = anim.animatedValue as Int
                val lp = layoutParams
                lp.height = h
                layoutParams = lp
                onHeightChanged?.invoke(h)
            }
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(a: android.animation.Animator) {
                    if (!show) visibility = View.GONE
                }
            })
        }
        animator!!.start()
    }
}
