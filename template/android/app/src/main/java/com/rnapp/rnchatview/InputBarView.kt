package com.rnapp.rnchatview

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.TextUtils
import android.text.TextWatcher
import android.util.Log
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
import com.rnapp.rnchatview.ChatLayoutConstants as C

private const val TAG = "InputBarView"

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
// FrameLayout. Структура:
//
//   [bottomRow]  — attach | editText | send  (WRAP_CONTENT, gravity=BOTTOM)
//   [topPanel]   — accent | title+preview | close
//                  позиционируется ВЫШЕ bottomRow через translationY = -bottomRowHeight - panelH
//                  при показе анимируется к translationY = -bottomRowHeight (вплотную над row)
//
// Родитель (RNChatView) должен иметь clipChildren=false чтобы панель была видна
// поверх RecyclerView. Высота InputBarView не меняется — RN не трогается.

class InputBarView(context: Context) : FrameLayout(context) {

    var delegate: InputBarDelegate? = null

    var mode: InputBarMode = InputBarMode.Normal
        private set

    private var currentTheme: ChatTheme? = null
    private var lastBottomRowHeight = 0

    // ─── Bottom row ───────────────────────────────────────────────────────

    private val bottomRow = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity     = Gravity.BOTTOM
        setPadding(dpToPx(8f), dpToPx(6f), dpToPx(8f), dpToPx(6f))
    }

    private val separator = View(context)

    private val attachButton = ImageView(context).apply {
        setImageResource(android.R.drawable.ic_menu_add)
        isClickable = true; isFocusable = true
        setOnClickListener { delegate?.onAttachmentPress() }
    }

    val editText = EditText(context).apply {
        hint      = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines  = 5
        minLines  = 1
        imeOptions = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        val pad = dpToPx(14f); val vPad = dpToPx(9f)
        setPadding(pad, vPad, pad, vPad)
    }

    private val sendButton = FrameLayout(context).apply {
        isClickable = true; isFocusable = true
        setOnClickListener { handleSend() }
        background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.rgb(199, 199, 204))
        }
    }

    private val sendIcon = ImageView(context).apply {
        setImageResource(android.R.drawable.ic_menu_send)
        setColorFilter(Color.WHITE)
    }

    // ─── Top panel ────────────────────────────────────────────────────────
    // Живёт в том же FrameLayout, но рисуется поверх благодаря z-order (добавляется последним)
    // В скрытом состоянии translationY сдвигает его ниже нижней границы FrameLayout
    // (невидимо), при показе выезжает вверх к позиции над bottomRow.

    private val topPanel = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity     = Gravity.CENTER_VERTICAL
        setPadding(dpToPx(12f), dpToPx(8f), dpToPx(12f), dpToPx(8f))
        elevation   = dpToPx(4f).toFloat()
        alpha       = 0f
    }

    private val topPanelBar = View(context).apply {
        background = GradientDrawable().apply {
            setColor(Color.rgb(0, 122, 255))
            cornerRadius = dpToPx(2f).toFloat()
        }
    }

    private val topPanelTextContainer = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
    }

    private val topPanelTitle = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        setTypeface(null, Typeface.BOLD)
    }

    private val topPanelPreview = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        maxLines  = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelClose = ImageView(context).apply {
        setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
        isClickable = true; isFocusable = true
        setOnClickListener { closeTopPanel() }
    }

    // ─── Init ─────────────────────────────────────────────────────────────

    init {
        val btnSize = dpToPx(36f)
        val ph      = dpToPx(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

        // ── separator (верхняя граница всего inputBar) ─────────────────────
        addView(separator, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)).also {
            it.gravity = Gravity.TOP
        })

        // ── bottomRow ──────────────────────────────────────────────────────
        bottomRow.addView(attachButton,
            LinearLayout.LayoutParams(btnSize, btnSize).also { it.marginEnd = dpToPx(4f) })
        bottomRow.addView(editText,
            LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        sendButton.addView(sendIcon,
            FrameLayout.LayoutParams(dpToPx(20f), dpToPx(20f), Gravity.CENTER))
        bottomRow.addView(sendButton,
            LinearLayout.LayoutParams(btnSize, btnSize).also { it.marginStart = dpToPx(4f) })
        addView(bottomRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
            it.gravity = Gravity.BOTTOM
        })

        // ── topPanel — фиксированной высоты, изначально скрыта вниз ───────
        topPanelTextContainer.addView(topPanelTitle,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        topPanelTextContainer.addView(topPanelPreview,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        topPanel.addView(topPanelBar,
            LinearLayout.LayoutParams(dpToPx(C.REPLY_BAR_WIDTH_DP), dpToPx(32f)).also { it.marginEnd = dpToPx(8f) })
        topPanel.addView(topPanelTextContainer,
            LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        topPanel.addView(topPanelClose,
            LinearLayout.LayoutParams(dpToPx(28f), dpToPx(28f)))

        // topPanel позиционируется в BOTTOM FrameLayout, ниже bottomRow
        // translationY = ph → полностью скрыта за нижней границей
        // при показе → translationY = -ph (выезжает выше bottomRow)
        addView(topPanel, LayoutParams(LayoutParams.MATCH_PARENT, ph).also {
            it.gravity = Gravity.BOTTOM
        })
        topPanel.translationY = ph.toFloat()  // скрыта вниз (за пределами FrameLayout)

        // ── listeners ──────────────────────────────────────────────────────
        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) { updateSendButton(s?.isNotBlank() == true) }
        })
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }
    }

    // ─── Layout ───────────────────────────────────────────────────────────

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        val rowH = bottomRow.height
        if (rowH != lastBottomRowHeight && rowH > 0) {
            lastBottomRowHeight = rowH
            // Если панель видима — обновить её позицию сразу (без анимации)
            if (mode != InputBarMode.Normal) {
                topPanel.translationY = -dpToPx(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP).toFloat()
            }
            notifyHeightChanged()
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        Log.d(TAG, "beginReply sender=${info.snapshotSenderName}")
        currentTheme = theme
        mode = InputBarMode.Reply(info)
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        Log.d(TAG, "beginEdit id=$messageId")
        currentTheme = theme
        mode = InputBarMode.Edit(messageId, text)
        editText.setText(text)
        editText.setSelection(text.length)
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun cancelMode(theme: ChatTheme? = null) {
        if (mode != InputBarMode.Normal) clearAndReset(theme)
    }

    fun applyTheme(theme: ChatTheme) {
        currentTheme = theme
        setBackgroundColor(theme.inputBarBackground)
        separator.setBackgroundColor(theme.inputBarSeparator)
        topPanel.setBackgroundColor(theme.inputBarBackground)
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        editText.background = GradientDrawable().apply {
            setColor(theme.inputBarTextViewBg)
            cornerRadius = dpToPx(20f).toFloat()
        }
        attachButton.setColorFilter(theme.inputBarTint)
        (topPanelBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        topPanelTitle.setTextColor(theme.replyPanelSender)
        topPanelPreview.setTextColor(theme.replyPanelText)
        topPanelClose.setColorFilter(theme.replyPanelClose)
        updateSendButton(editText.text?.isNotBlank() == true)
    }

    // ─── Mode UI ──────────────────────────────────────────────────────────

    private fun applyModeToUI(animate: Boolean) {
        val panelVisible: Boolean
        val title: String
        val preview: String

        when (val m = mode) {
            is InputBarMode.Normal -> { panelVisible = false; title = ""; preview = "" }
            is InputBarMode.Reply  -> {
                panelVisible = true
                title   = "Reply to ${m.info.snapshotSenderName ?: "message"}"
                preview = m.info.snapshotText ?: if (m.info.snapshotHasImage) "📷 Photo" else ""
            }
            is InputBarMode.Edit   -> {
                panelVisible = true
                title   = "Edit message"
                preview = m.originalText
            }
        }

        topPanelTitle.text   = title
        topPanelPreview.text = preview

        val ph      = dpToPx(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP).toFloat()
        // Скрыта = уехала вниз (+ph). Видима = стоит выше bottomRow (-ph).
        val toY     = if (panelVisible) -ph else ph
        val toAlpha = if (panelVisible) 1f  else 0f

        Log.d(TAG, "applyModeToUI visible=$panelVisible animate=$animate fromY=${topPanel.translationY} toY=$toY")

        if (animate) {
            animatePanel(toY = toY, toAlpha = toAlpha)
        } else {
            panelAnimator?.cancel()
            topPanel.translationY = toY
            topPanel.alpha        = toAlpha
        }

        notifyHeightChanged()
    }

    // ─── Animation ────────────────────────────────────────────────────────

    private var panelAnimator: AnimatorSet? = null

    private fun animatePanel(toY: Float, toAlpha: Float) {
        panelAnimator?.cancel()
        val show = toAlpha > 0f
        panelAnimator = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(topPanel, View.TRANSLATION_Y, topPanel.translationY, toY),
                ObjectAnimator.ofFloat(topPanel, View.ALPHA, topPanel.alpha, toAlpha)
            )
            duration     = if (show) 220 else 180
            interpolator = DecelerateInterpolator()
            start()
        }
    }

    // ─── Send / reset ─────────────────────────────────────────────────────

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
            is InputBarMode.Reply  -> delegate?.onCancelReply()
            is InputBarMode.Edit   -> delegate?.onCancelEdit()
            is InputBarMode.Normal -> Unit
        }
    }

    private fun clearAndReset(theme: ChatTheme? = null) {
        theme?.let { currentTheme = it }
        editText.setText("")
        mode = InputBarMode.Normal
        updateSendButton(false)
        applyModeToUI(animate = true)
    }

    private fun updateSendButton(hasText: Boolean) {
        val color = if (hasText) currentTheme?.inputBarTint       ?: Color.rgb(0, 122, 255)
                    else        currentTheme?.inputBarPlaceholder ?: Color.rgb(199, 199, 204)
        (sendButton.background as? GradientDrawable)?.setColor(color)
    }

    private fun requestEditFocus() {
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun notifyHeightChanged() {
        post { delegate?.onHeightChanged(height) }
    }

    private fun dpToPx(dp: Float) = context.dpToPx(dp)
}
