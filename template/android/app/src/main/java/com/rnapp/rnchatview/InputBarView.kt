package com.rnapp.rnchatview

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.Drawable
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
import com.rnapp.rnchatview.ChatLayoutConstants as C

interface InputBarDelegate {
    fun onSendText(text: String, replyToId: String?)
    fun onEditText(text: String, messageId: String)
    fun onCancelReply()
    fun onCancelEdit()
    fun onAttachmentPress()
    fun onHeightChanged(heightPx: Int, topPanelVisibleHeight: Int)
}

class InputBarView(context: Context) : LinearLayout(context) {

    var delegate: InputBarDelegate? = null

    var mode: InputBarMode = InputBarMode.Normal
        private set

    private var currentTheme: ChatTheme? = null
    private val topPanelHeight = dpToPx(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

    private val topPanel = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dpToPx(12f), dpToPx(8f), dpToPx(8f), dpToPx(8f))
        visibility = GONE
    }

    private val accentBar = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dpToPx(1.5f).toFloat()
            setColor(Color.rgb(0, 122, 255))
        }
    }

    private val topPanelTexts = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
    }

    private val topPanelTitle = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        setTypeface(null, Typeface.BOLD)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelPreview = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelClose = ImageView(context).apply {
        setImageDrawable(CloseCircleDrawable())
        isClickable = true; isFocusable = true
        background = with(context) {
            val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
            ta.getDrawable(0).also { ta.recycle() }
        }
        contentDescription = "Cancel"
        setOnClickListener { closeTopPanel() }
    }

    private val topPanelDivider = View(context).apply { visibility = GONE }
    private val mainDivider = View(context)

    private val inputRow = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.BOTTOM
        setPadding(dpToPx(4f), dpToPx(6f), dpToPx(8f), dpToPx(6f))
    }

    private val attachButton = ImageView(context).apply {
        setImageResource(android.R.drawable.ic_menu_add)
        isClickable = true; isFocusable = true
        background = with(context) {
            val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
            ta.getDrawable(0).also { ta.recycle() }
        }
        setOnClickListener { delegate?.onAttachmentPress() }
    }

    val editText = EditText(context).apply {
        hint = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines = 5
        minLines = 1
        imeOptions = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        setPadding(dpToPx(14f), dpToPx(9f), dpToPx(14f), dpToPx(9f))
        background = GradientDrawable().apply {
            setColor(Color.rgb(242, 242, 247))
            cornerRadius = dpToPx(18f).toFloat()
        }
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

    var topPanelVisibleHeight: Int = 0
        private set

    init {
        orientation = VERTICAL
        val btnSize = dpToPx(36f)

        addView(mainDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))

        topPanelTexts.addView(topPanelTitle, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        topPanelTexts.addView(topPanelPreview, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        topPanel.addView(accentBar,
            LayoutParams(dpToPx(C.REPLY_BAR_WIDTH_DP), dpToPx(34f)).also { it.marginEnd = dpToPx(10f) })
        topPanel.addView(topPanelTexts, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        topPanel.addView(topPanelClose, LayoutParams(dpToPx(30f), dpToPx(30f)))

        addView(topPanel, LayoutParams(LayoutParams.MATCH_PARENT, topPanelHeight))
        addView(topPanelDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))

        inputRow.addView(attachButton, LayoutParams(btnSize, btnSize).also { it.marginEnd = dpToPx(2f) })
        inputRow.addView(editText, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        sendButton.addView(sendIcon, FrameLayout.LayoutParams(dpToPx(20f), dpToPx(20f), Gravity.CENTER))
        inputRow.addView(sendButton, LayoutParams(btnSize, btnSize).also { it.marginStart = dpToPx(4f) })
        addView(inputRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) { updateSendButton(s?.isNotBlank() == true) }
        })
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }
    }

    /** Переводит инпут в режим ответа на сообщение. */
    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        currentTheme = theme
        val prev = mode
        mode = InputBarMode.Reply(info)
        if (prev is InputBarMode.Edit) editText.setText("")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    /** Переводит инпут в режим редактирования сообщения. */
    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        currentTheme = theme
        mode = InputBarMode.Edit(messageId, text)
        editText.setText(text)
        editText.setSelection(text.length)
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    /** Отменяет текущий режим и возвращает инпут в Normal. */
    fun cancelMode(theme: ChatTheme? = null) {
        if (mode != InputBarMode.Normal) clearAndReset(theme)
    }

    /** Применяет тему оформления ко всем дочерним вью. */
    fun applyTheme(theme: ChatTheme) {
        currentTheme = theme
        setBackgroundColor(theme.inputBarBackground)
        topPanel.setBackgroundColor(theme.replyPanelBackground)
        mainDivider.setBackgroundColor(theme.inputBarSeparator)
        topPanelDivider.setBackgroundColor(theme.inputBarSeparator)
        (accentBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        topPanelTitle.setTextColor(theme.replyPanelSender)
        topPanelPreview.setTextColor(theme.replyPanelText)
        (topPanelClose.drawable as? CloseCircleDrawable)?.color = theme.replyPanelClose
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        (editText.background as? GradientDrawable)?.setColor(theme.inputBarTextViewBg)
        attachButton.setColorFilter(theme.inputBarTint)
        updateSendButton(editText.text?.isNotBlank() == true)
    }

    private fun applyModeToUI(animate: Boolean) {
        val show: Boolean; val title: String; val preview: String
        when (val m = mode) {
            is InputBarMode.Normal -> { show = false; title = ""; preview = "" }
            is InputBarMode.Reply -> {
                show = true
                title = m.info.snapshotSenderName ?: "Message"
                preview = m.info.snapshotText ?: if (m.info.snapshotHasImage) "📷 Photo" else ""
            }
            is InputBarMode.Edit -> { show = true; title = "Edit message"; preview = m.originalText }
        }
        topPanelTitle.text = title
        topPanelPreview.text = preview
        if (animate) animatePanel(show) else setPanel(show, notify = true)
    }

    private var panelAnimator: AnimatorSet? = null

    private fun animatePanel(show: Boolean) {
        panelAnimator?.cancel()
        panelAnimator = null

        if (show) {
            setPanel(visible = true, notify = true)
            topPanel.alpha = 0f
            topPanel.translationY = -dpToPx(6f).toFloat()
            panelAnimator = AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(topPanel, View.ALPHA, 0f, 1f),
                    ObjectAnimator.ofFloat(topPanel, View.TRANSLATION_Y, topPanel.translationY, 0f)
                )
                duration = 200
                interpolator = DecelerateInterpolator(1.5f)
                start()
            }
        } else {
            panelAnimator = AnimatorSet().apply {
                play(ObjectAnimator.ofFloat(topPanel, View.ALPHA, topPanel.alpha, 0f).apply { duration = 150 })
                interpolator = DecelerateInterpolator()
                addListener(object : android.animation.AnimatorListenerAdapter() {
                    override fun onAnimationEnd(a: android.animation.Animator) {
                        topPanel.alpha = 1f
                        topPanel.translationY = 0f
                        setPanel(visible = false, notify = true)
                    }
                })
                start()
            }
        }
    }

    private fun setPanel(visible: Boolean, notify: Boolean) {
        val vis = if (visible) VISIBLE else GONE
        topPanel.visibility = vis
        topPanelDivider.visibility = vis
        topPanelVisibleHeight = if (visible) topPanelHeight else 0
        if (notify) notifyHeightChanged()
    }

    private fun notifyHeightChanged() {
        val panelH = topPanelVisibleHeight
        val wSpec = if (width > 0)
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY)
        else
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        val hSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        measure(wSpec, hSpec)
        val measuredH = measuredHeight
        if (measuredH > 0) {
            delegate?.onHeightChanged(measuredH, panelH)
        } else {
            post {
                measure(wSpec, hSpec)
                val h = if (measuredHeight > 0) measuredHeight else height
                delegate?.onHeightChanged(h, panelH)
            }
        }
    }

    private fun handleSend() {
        val text = editText.text?.toString()?.trim() ?: return
        if (text.isBlank()) return
        when (val m = mode) {
            is InputBarMode.Normal -> delegate?.onSendText(text, null)
            is InputBarMode.Reply -> delegate?.onSendText(text, m.info.replyToId)
            is InputBarMode.Edit -> delegate?.onEditText(text, m.messageId)
        }
        clearAndReset()
    }

    private fun closeTopPanel() {
        val prev = mode
        clearAndReset()
        when (prev) {
            is InputBarMode.Reply -> delegate?.onCancelReply()
            is InputBarMode.Edit -> delegate?.onCancelEdit()
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
        val color = if (hasText) currentTheme?.inputBarTint ?: Color.rgb(0, 122, 255)
        else currentTheme?.inputBarPlaceholder ?: Color.rgb(199, 199, 204)
        (sendButton.background as? GradientDrawable)?.setColor(color)
    }

    private fun requestEditFocus() {
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun dpToPx(dp: Float) = context.dpToPx(dp)
}

private class CloseCircleDrawable : Drawable() {

    var color: Int = Color.rgb(199, 199, 204)
        set(v) { field = v; invalidateSelf() }

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val cross = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat(); val h = bounds.height().toFloat()
        val cx = w / 2f; val cy = h / 2f
        val r = minOf(cx, cy) - 1f
        val arm = r * 0.34f
        fill.color = color
        c.drawCircle(cx, cy, r, fill)
        cross.strokeWidth = r * 0.20f
        c.drawLine(cx - arm, cy - arm, cx + arm, cy + arm, cross)
        c.drawLine(cx + arm, cy - arm, cx - arm, cy + arm, cross)
    }

    override fun setAlpha(a: Int) { fill.alpha = a; cross.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { fill.colorFilter = cf; invalidateSelf() }

    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
