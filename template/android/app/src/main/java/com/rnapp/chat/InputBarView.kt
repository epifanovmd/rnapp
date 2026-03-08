package com.rnapp.chat.inputbar

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.TextWatcher
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.core.view.isVisible
import com.rnapp.chat.model.ChatInputAction
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF

/**
 * InputBarView — панель ввода сообщения.
 *
 * Зеркалит InputBarView.swift по структуре и поведению.
 *
 * Структура:
 *  LinearLayout (vertical, root = this)
 *   ├─ View (topSeparator — тонкая линия-разделитель вверху)
 *   ├─ [ReplyEditPanel] LinearLayout (анимировано появляется при reply/edit)
 *   │    ├─ View (accent line, 3dp)
 *   │    ├─ LinearLayout (vertical: senderLabel + bodyLabel)
 *   │    └─ ImageButton (close)
 *   └─ LinearLayout (horizontal: attachButton + editText + sendButton)
 *
 * Анимация панели:
 *  Панель reply/edit появляется/скрывается через animate().translationY + isVisible,
 *  что точно повторяет поведение iOS (UIView.animate + topPanel height constraint).
 *
 * onHeightChanged:
 *  Вызывается при каждом изменении высоты через addOnLayoutChangeListener.
 *  ChatView использует это для пересчёта RecyclerView bottom padding.
 */
class InputBarView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : LinearLayout(context, attrs) {

    // ─── Public callbacks ─────────────────────────────────────────────────────

    var onSendClick: ((text: String) -> Unit)?       = null
    var onAttachClick: (() -> Unit)?                 = null
    var onCancelAction: (() -> Unit)?                = null
    var onHeightChanged: ((heightPx: Int) -> Unit)?  = null

    // ─── Views ─────────────────────────────────────────────────────────────────

    private val topSeparator: View
    private val replyPanel: LinearLayout
    private val replyAccentLine: View
    private val replySenderLabel: TextView
    private val replyBodyLabel: TextView
    private val replyCloseButton: ImageButton
    val editText: EditText
    private val attachButton: ImageButton
    private val sendButton: ImageButton

    // ─── State ────────────────────────────────────────────────────────────────

    private var currentTheme: ChatTheme = ChatTheme.light
    private var replyPanelVisible: Boolean = false
    private var lastHeight: Int = 0

    init {
        orientation = VERTICAL
        // Тень/elevation вместо border — как в iOS
        elevation = 8f.dpToPxF(context)

        fun dp(v: Float): Int = v.dpToPx(context)

        // ── Top separator ──────────────────────────────────────────────────────
        topSeparator = View(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 1)
        }
        addView(topSeparator)

        // ── Reply/Edit panel ───────────────────────────────────────────────────
        replyAccentLine = View(context).apply {
            layoutParams = LayoutParams(
                dp(ChatLayoutConstants.REPLY_ACCENT_WIDTH_DP),
                LayoutParams.MATCH_PARENT
            )
        }

        replySenderLabel = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_SENDER_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        replyBodyLabel = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        val replyTexts = LinearLayout(context).apply {
            orientation  = VERTICAL
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dp(8f)
            }
            addView(replySenderLabel)
            addView(replyBodyLabel)
        }

        replyCloseButton = ImageButton(context).apply {
            // В продакшне: setImageResource(R.drawable.ic_close)
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            background = null
            val s = dp(32f)
            layoutParams = LayoutParams(s, LayoutParams.MATCH_PARENT)
            setPadding(dp(4f), 0, dp(8f), 0)
            setOnClickListener { onCancelAction?.invoke() }
        }

        replyPanel = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity     = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                dp(ChatLayoutConstants.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)
            )
            val hPad = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)
            setPadding(hPad, 0, hPad, 0)
            addView(replyAccentLine)
            addView(replyTexts)
            addView(replyCloseButton)
            // Панель скрыта изначально без анимации
            translationY = -dp(ChatLayoutConstants.INPUT_BAR_REPLY_PANEL_HEIGHT_DP).toFloat()
            isVisible = false
        }
        addView(replyPanel)

        // ── Input row ──────────────────────────────────────────────────────────
        val iconSize = dp(ChatLayoutConstants.INPUT_BAR_ICON_SIZE_DP)
        val iconPad  = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)

        attachButton = ImageButton(context).apply {
            // В продакшне: setImageResource(R.drawable.ic_attach)
            setImageResource(android.R.drawable.ic_menu_add)
            background = null
            layoutParams = LayoutParams(iconSize + iconPad * 2, LayoutParams.MATCH_PARENT)
            setPadding(iconPad, 0, iconPad, 0)
            setOnClickListener { onAttachClick?.invoke() }
        }

        editText = EditText(context).apply {
            hint     = "Message…"
            minLines = 1
            maxLines = 5
            textSize = ChatLayoutConstants.MESSAGE_TEXT_SIZE_SP
            background = null
            setPadding(0, dp(ChatLayoutConstants.INPUT_BAR_VERTICAL_PADDING_DP),
                          0, dp(ChatLayoutConstants.INPUT_BAR_VERTICAL_PADDING_DP))
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
            // Убираем подчёркивание EditText
            background = null
        }

        sendButton = ImageButton(context).apply {
            // В продакшне: setImageResource(R.drawable.ic_send)
            setImageResource(android.R.drawable.ic_menu_send)
            background = null
            layoutParams = LayoutParams(iconSize + iconPad * 2, LayoutParams.MATCH_PARENT)
            setPadding(iconPad, 0, iconPad, 0)
            setOnClickListener {
                val text = editText.text.toString().trim()
                if (text.isNotEmpty()) {
                    onSendClick?.invoke(text)
                    editText.setText("")
                }
            }
        }

        // Скруглённый фон у EditText (как в iOS — inputBarTextViewBg)
        val inputRow = LinearLayout(context).apply {
            orientation  = HORIZONTAL
            gravity      = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                val vPad = dp(ChatLayoutConstants.INPUT_BAR_VERTICAL_PADDING_DP / 2)
                topMargin    = vPad
                bottomMargin = vPad
            }
            addView(attachButton)
            // EditText в скруглённом контейнере
            val editContainer = FrameLayout(context).apply {
                layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
                editText.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    val p = dp(ChatLayoutConstants.BUBBLE_HORIZONTAL_PAD_DP)
                    marginStart = p; marginEnd = p
                }
                addView(editText)
            }
            addView(editContainer)
            addView(sendButton)
        }
        addView(inputRow)

        // ── Layout change listener ─────────────────────────────────────────────
        addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            val newH = bottom - top
            if (newH > 0 && newH != lastHeight) {
                lastHeight = newH
                onHeightChanged?.invoke(newH)
            }
        }

        applyTheme(currentTheme)
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    fun applyTheme(theme: ChatTheme) {
        currentTheme = theme
        setBackgroundColor(theme.inputBarBackground)
        topSeparator.setBackgroundColor(theme.inputBarSeparator)
        elevation = 8f.dpToPxF(context)

        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)

        // Скруглённый фон поля ввода
        val parent = editText.parent as? FrameLayout
        parent?.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = ChatLayoutConstants.INPUT_BAR_CORNER_RADIUS_DP.dpToPxF(context)
            setColor(theme.inputBarTextViewBg)
        }

        attachButton.setColorFilter(theme.inputBarTint)
        sendButton.setColorFilter(theme.inputBarTint)
        replyCloseButton.setColorFilter(theme.replyPanelClose)
        replyAccentLine.setBackgroundColor(theme.replyPanelAccent)
        replySenderLabel.setTextColor(theme.replyPanelSender)
        replyBodyLabel.setTextColor(theme.replyPanelText)
        replyPanel.setBackgroundColor(theme.replyPanelBackground)
    }

    /**
     * Обновляет панель reply/edit согласно [inputAction].
     * Анимирует показ/скрытие панели (зеркало iOS topPanel).
     */
    fun setInputAction(inputAction: ChatInputAction?, messages: List<ChatMessage>) {
        when (inputAction?.type) {
            "reply" -> {
                val msg = messages.find { it.id == inputAction.messageId }
                replySenderLabel.text = msg?.senderName ?: "Reply"
                replySenderLabel.setTextColor(currentTheme.replyPanelSender)
                replyBodyLabel.text = when {
                    !msg?.text.isNullOrBlank()      -> msg!!.text!!
                    msg?.images?.isNotEmpty() == true -> "📷 Photo"
                    else                             -> ""
                }
                showReplyPanel(true)
            }
            "edit" -> {
                val msg = messages.find { it.id == inputAction.messageId }
                replySenderLabel.text = "Edit message"
                replySenderLabel.setTextColor(currentTheme.inputBarTint)
                replyBodyLabel.text = msg?.text ?: ""
                // Заполняем поле ввода текущим текстом
                editText.setText(msg?.text ?: "")
                editText.setSelection(editText.text.length)
                showReplyPanel(true)
            }
            else -> {
                showReplyPanel(false)
                // Не очищаем текст при cancel edit — это делает ChatView после получения колбэка
            }
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private fun showReplyPanel(show: Boolean) {
        if (replyPanelVisible == show) return
        replyPanelVisible = show

        val panelH = replyPanel.layoutParams.height.toFloat()

        if (show) {
            replyPanel.isVisible    = true
            replyPanel.translationY = -panelH
            replyPanel.animate()
                .translationY(0f)
                .setDuration(200L)
                .setInterpolator(android.view.animation.DecelerateInterpolator())
                .start()
        } else {
            replyPanel.animate()
                .translationY(-panelH)
                .setDuration(180L)
                .setInterpolator(android.view.animation.AccelerateInterpolator())
                .withEndAction { replyPanel.isVisible = false }
                .start()
        }
    }
}
