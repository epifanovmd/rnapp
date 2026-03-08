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
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx

/**
 * InputBar — панель ввода сообщения.
 *
 * Структура:
 *  LinearLayout (vertical, root)
 *   ├─ [ReplyEditPanel] LinearLayout (появляется при reply/edit)
 *   │    ├─ View (accent line)
 *   │    ├─ LinearLayout (vertical: sender, text)
 *   │    └─ ImageButton (close / cancel)
 *   └─ LinearLayout (horizontal: attach + editText + send)
 *
 * Панель reply/edit сдвигает содержимое RecyclerView вверх через
 * TranslationY или padding — управляется снаружи через listener.
 */
class InputBarView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : LinearLayout(context, attrs) {

    // ── Public callbacks ──────────────────────────────────────────────────
    var onSendClick: ((text: String) -> Unit)? = null
    var onAttachClick: (() -> Unit)?            = null
    var onCancelAction: (() -> Unit)?           = null
    var onHeightChanged: ((heightPx: Int) -> Unit)? = null

    // ── Views ─────────────────────────────────────────────────────────────
    private val replyPanel:    LinearLayout
    private val replyAccent:   View
    private val replySenderTv: TextView
    private val replyTextTv:   TextView
    private val replyCloseBt:  ImageButton
    private val attachButton:  ImageButton
    val editText:              EditText
    private val sendButton:    ImageButton

    private var theme: ChatTheme = ChatTheme.light

    init {
        orientation = VERTICAL

        fun dp(v: Float) = v.dpToPx(context)

        // ── Reply / Edit panel ─────────────────────────────────────────────
        replyAccent = View(context).apply {
            layoutParams = LayoutParams(dp(ChatLayoutConstants.REPLY_ACCENT_WIDTH_DP), LayoutParams.MATCH_PARENT)
        }
        replySenderTv = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_SENDER_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }
        replyTextTv = TextView(context).apply {
            textSize  = ChatLayoutConstants.REPLY_TEXT_SIZE_SP
            maxLines  = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }
        val replyTexts = LinearLayout(context).apply {
            orientation = VERTICAL
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dp(8f)
            }
            addView(replySenderTv)
            addView(replyTextTv)
        }
        replyCloseBt = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            background = null
            val s = dp(24f)
            layoutParams = LayoutParams(s, s)
            setOnClickListener { onCancelAction?.invoke() }
        }
        replyPanel = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity     = Gravity.CENTER_VERTICAL
            val h = dp(ChatLayoutConstants.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, h)
            val pad = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)
            setPadding(pad, 0, pad, 0)
            isVisible = false
            addView(replyAccent)
            addView(replyTexts)
            addView(replyCloseBt)
        }
        addView(replyPanel)

        // ── Input row ──────────────────────────────────────────────────────
        val iconSize = dp(ChatLayoutConstants.INPUT_BAR_ICON_SIZE_DP)
        val iconPad  = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)

        attachButton = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_add)
            background = null
            layoutParams = LayoutParams(iconSize + iconPad * 2, LayoutParams.MATCH_PARENT)
            setPadding(iconPad, 0, iconPad, 0)
            setOnClickListener { onAttachClick?.invoke() }
        }

        editText = EditText(context).apply {
            hint    = "Message…"
            minLines = 1
            maxLines = 5
            textSize = ChatLayoutConstants.MESSAGE_TEXT_SIZE_SP
            background = null
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply {
                val vPad = dp(ChatLayoutConstants.INPUT_BAR_VERTICAL_PADDING_DP)
                topMargin    = vPad
                bottomMargin = vPad
            }
        }

        sendButton = ImageButton(context).apply {
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

        val inputRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity     = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            addView(attachButton)
            addView(editText)
            addView(sendButton)
        }
        addView(inputRow)

        // ── Height change listener ─────────────────────────────────────────
        addOnLayoutChangeListener { _, _, _, _, _, _, oldTop, _, oldBottom ->
            val newH = height
            if (newH > 0) onHeightChanged?.invoke(newH)
        }

        applyTheme(theme)
    }

    // ── Public API ────────────────────────────────────────────────────────

    fun applyTheme(newTheme: ChatTheme) {
        theme = newTheme
        setBackgroundColor(theme.inputBarBackground)

        // Top separator
        val sep = View(context).apply { setBackgroundColor(theme.inputBarSeparator) }
        // Already added as first child? Manage via background/elevation instead:
        elevation = 8f

        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        editText.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = ChatLayoutConstants.INPUT_BAR_CORNER_RADIUS_DP.dpToPx(context).toFloat()
            setColor(theme.inputBarTextViewBg)
        }
        attachButton.setColorFilter(theme.inputBarTint)
        sendButton.setColorFilter(theme.inputBarTint)
        replyCloseBt.setColorFilter(theme.replyPanelClose)
        replyAccent.setBackgroundColor(theme.replyPanelAccent)
        replySenderTv.setTextColor(theme.replyPanelSender)
        replyTextTv.setTextColor(theme.replyPanelText)
        replyPanel.setBackgroundColor(theme.replyPanelBackground)
    }

    /**
     * Обновляет панель reply/edit согласно [inputAction].
     * Возвращает true если панель стала видима.
     */
    fun setInputAction(inputAction: ChatInputAction?, messages: List<com.rnapp.chat.model.ChatMessage>) {
        when (inputAction?.type) {
            "reply" -> {
                val msg = messages.find { it.id == inputAction.messageId }
                replySenderTv.text = msg?.senderName ?: "Reply"
                replyTextTv.text   = msg?.text ?: if (msg?.images?.isNotEmpty() == true) "📷 Photo" else ""
                replySenderTv.setTextColor(theme.replyPanelSender)
                showReplyPanel(true)
            }
            "edit" -> {
                val msg = messages.find { it.id == inputAction.messageId }
                replySenderTv.text = "Edit"
                replyTextTv.text   = msg?.text ?: ""
                replySenderTv.setTextColor(theme.inputBarTint)
                editText.setText(msg?.text ?: "")
                editText.setSelection(editText.text.length)
                showReplyPanel(true)
            }
            else -> {
                showReplyPanel(false)
                if (inputAction?.type != "edit") editText.setText("")
            }
        }
    }

    private fun showReplyPanel(show: Boolean) {
        if (replyPanel.isVisible == show) return
        replyPanel.isVisible = show
        // onHeightChanged вызовется автоматически через addOnLayoutChangeListener
    }
}
