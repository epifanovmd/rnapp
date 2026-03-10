package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.TextUtils
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.isVisible
import com.rnapp.rnchatview.ChatLayoutConstants as C

// ─── InputBarDelegate ─────────────────────────────────────────────────────────

interface InputBarDelegate {
    fun onSendText(text: String, replyToId: String?)
    fun onEditText(text: String, messageId: String)
    fun onCancelReply()
    fun onCancelEdit()
    fun onAttachmentPress()
    fun onHeightChanged(heightPx: Int)
}

// ─── InputBarView ─────────────────────────────────────────────────────────────
//
// Полная панель ввода: режимы Normal / Reply / Edit с анимацией.
// Точный аналог Swift InputBarView.

class InputBarView(context: Context) : LinearLayout(context) {

    // ─── Delegate ─────────────────────────────────────────────────────────
    var delegate: InputBarDelegate? = null

    // ─── Mode ─────────────────────────────────────────────────────────────
    var mode: InputBarMode = InputBarMode.Normal
        private set

    // ─── Top panel (reply/edit preview) ───────────────────────────────────

    private val topPanel: LinearLayout = LinearLayout(context).apply {
        orientation = HORIZONTAL
        visibility  = View.GONE
        gravity     = Gravity.CENTER_VERTICAL
        setPadding(context.dpToPx(12f), context.dpToPx(8f), context.dpToPx(12f), 0)
    }

    private val topPanelBar: View = View(context).apply {
        layoutParams = LinearLayout.LayoutParams(
            context.dpToPx(C.REPLY_BAR_WIDTH_DP),
            LinearLayout.LayoutParams.MATCH_PARENT
        ).apply { marginEnd = context.dpToPx(8f) }
        background = GradientDrawable().apply {
            setColor(Color.rgb(0, 122, 255))
            cornerRadius = context.dpToPx(2f).toFloat()
        }
    }

    private val topPanelTextContainer: LinearLayout = LinearLayout(context).apply {
        orientation  = VERTICAL
        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    }

    private val topPanelTitle: TextView = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        setTypeface(null, Typeface.BOLD)
    }

    private val topPanelPreview: TextView = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        maxLines   = 1
        ellipsize  = TextUtils.TruncateAt.END
    }

    private val topPanelClose: ImageView = ImageView(context).apply {
        layoutParams = LinearLayout.LayoutParams(context.dpToPx(28f), context.dpToPx(28f))
        setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
        isClickable = true; isFocusable = true
        setOnClickListener { closeTopPanel() }
    }

    // ─── Separator ────────────────────────────────────────────────────────

    private val separator: View = View(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, context.dpToPx(0.5f))
    }

    // ─── Bottom row ───────────────────────────────────────────────────────

    private val bottomRow: LinearLayout = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity     = Gravity.BOTTOM
        setPadding(context.dpToPx(8f), context.dpToPx(6f), context.dpToPx(8f), context.dpToPx(6f))
    }

    private val attachButton: ImageView = ImageView(context).apply {
        val size = context.dpToPx(36f)
        layoutParams = LinearLayout.LayoutParams(size, size).apply {
            marginEnd = context.dpToPx(4f)
        }
        setImageResource(android.R.drawable.ic_menu_add)
        isClickable = true; isFocusable = true
        setOnClickListener { delegate?.onAttachmentPress() }
    }

    val editText: EditText = EditText(context).apply {
        hint         = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines     = 5
        minLines     = 1
        imeOptions   = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        val pad = context.dpToPx(14f); val vPad = context.dpToPx(9f)
        setPadding(pad, vPad, pad, vPad)
    }

    private val sendButton: FrameLayout = FrameLayout(context).apply {
        val size = context.dpToPx(36f)
        layoutParams = LinearLayout.LayoutParams(size, size).apply { marginStart = context.dpToPx(4f) }
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#C7C7CC")) }
        isClickable = true; isFocusable = true
        setOnClickListener { handleSend() }
    }

    private val sendIcon: ImageView = ImageView(context).apply {
        layoutParams = FrameLayout.LayoutParams(context.dpToPx(20f), context.dpToPx(20f), Gravity.CENTER)
        setImageResource(android.R.drawable.ic_menu_send)
        setColorFilter(Color.WHITE)
    }

    // ─── Init ─────────────────────────────────────────────────────────────

    init {
        orientation = VERTICAL
        elevation   = context.dpToPx(4f).toFloat()

        topPanelTextContainer.addView(topPanelTitle)
        topPanelTextContainer.addView(topPanelPreview)
        topPanel.addView(topPanelBar)
        topPanel.addView(topPanelTextContainer)
        topPanel.addView(topPanelClose)

        sendButton.addView(sendIcon)
        bottomRow.addView(attachButton)
        bottomRow.addView(editText)
        bottomRow.addView(sendButton)

        addView(topPanel)
        addView(separator)
        addView(bottomRow)

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) { updateSendButton(s?.isNotBlank() == true) }
        })

        // Enter без Shift = отправка
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true }
            else false
        }
    }

    // ─── Public mode API ──────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        transition(InputBarMode.Reply(info), theme, focusInput = true)
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        editText.setText(text)
        editText.setSelection(text.length)
        transition(InputBarMode.Edit(messageId, text), theme, focusInput = true)
    }

    fun cancelMode(theme: ChatTheme? = null) {
        if (mode != InputBarMode.Normal) clearAndReset(theme)
    }

    fun applyTheme(theme: ChatTheme) {
        setBackgroundColor(theme.inputBarBackground)
        separator.setBackgroundColor(theme.inputBarSeparator)
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        editText.background = GradientDrawable().apply {
            setColor(theme.inputBarTextViewBg)
            cornerRadius = context.dpToPx(20f).toFloat()
        }
        attachButton.setColorFilter(theme.inputBarTint)
        topPanelBar.background = (topPanelBar.background as? GradientDrawable)?.also {
            it.setColor(theme.replyPanelAccent)
        } ?: GradientDrawable().apply {
            setColor(theme.replyPanelAccent)
            cornerRadius = context.dpToPx(2f).toFloat()
        }
        topPanelTitle.setTextColor(theme.replyPanelSender)
        topPanelPreview.setTextColor(theme.replyPanelText)
        topPanelClose.setColorFilter(theme.replyPanelClose)

        // Reapply mode-specific colors
        applyModeToUI(animate = false, theme = theme)
    }

    // ─── Private helpers ──────────────────────────────────────────────────

    private fun transition(newMode: InputBarMode, theme: ChatTheme, focusInput: Boolean) {
        if (mode == newMode) { if (focusInput) requestEditFocus(); return }
        mode = newMode
        applyModeToUI(animate = true, theme = theme)
        if (focusInput) requestEditFocus()
    }

    private fun applyModeToUI(animate: Boolean, theme: ChatTheme? = null) {
        val panelVisible: Boolean
        val title: String
        val preview: String

        when (val m = mode) {
            is InputBarMode.Normal -> {
                panelVisible = false
                title = ""; preview = ""
            }
            is InputBarMode.Reply -> {
                panelVisible = true
                title   = "Reply to ${m.info.senderName ?: "message"}"
                preview = when {
                    m.info.text != null -> m.info.text
                    m.info.hasImage     -> "📷 Photo"
                    else                -> ""
                }
            }
            is InputBarMode.Edit -> {
                panelVisible = true
                title   = "Edit message"
                preview = m.originalText
            }
        }

        topPanelTitle.text   = title
        topPanelPreview.text = preview

        if (animate) {
            if (panelVisible && topPanel.visibility != View.VISIBLE) {
                topPanel.visibility = View.VISIBLE
                topPanel.alpha      = 0f
                requestLayout()
                topPanel.animate().alpha(1f).setDuration(200)
                    .setInterpolator(DecelerateInterpolator()).start()
            } else if (!panelVisible && topPanel.visibility == View.VISIBLE) {
                topPanel.animate().alpha(0f).setDuration(150)
                    .withEndAction {
                        topPanel.visibility = View.GONE
                        requestLayout()
                    }.start()
            }
        } else {
            topPanel.visibility = if (panelVisible) View.VISIBLE else View.GONE
            topPanel.alpha = 1f
            requestLayout()
        }

        notifyHeightChanged()
    }

    private fun handleSend() {
        val text = editText.text?.toString()?.trim() ?: return
        if (text.isBlank()) return

        when (val m = mode) {
            is InputBarMode.Normal -> delegate?.onSendText(text, null)
            is InputBarMode.Reply  -> delegate?.onSendText(text, m.info.replyToId)
            is InputBarMode.Edit   -> delegate?.onEditText(text, m.messageId)
        }
        clearAndReset()
    }

    private fun closeTopPanel() {
        val prev = mode
        clearAndReset()
        when (prev) {
            is InputBarMode.Reply -> delegate?.onCancelReply()
            is InputBarMode.Edit  -> delegate?.onCancelEdit()
            is InputBarMode.Normal -> Unit
        }
    }

    private fun clearAndReset(theme: ChatTheme? = null) {
        editText.setText("")
        mode = InputBarMode.Normal
        updateSendButton(false)
        applyModeToUI(animate = true, theme = theme)
    }

    private fun updateSendButton(hasText: Boolean) {
        val color = if (hasText) Color.rgb(0, 122, 255) else Color.parseColor("#C7C7CC")
        (sendButton.background as? GradientDrawable)?.setColor(color)
    }

    private fun requestEditFocus() {
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun notifyHeightChanged() {
        post { post { delegate?.onHeightChanged(height) } }
    }
}
