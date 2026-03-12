package com.rnapp.rnchatview

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.TextUtils
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.rnapp.rnchatview.ChatLayoutConstants as C

private const val IBTAG = "InputBarView"

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

    // ── Top panel (reply / edit preview) ─────────────────────────────────────
    // Strategy: the panel is a child of LinearLayout with fixed height=topPanelHeight.
    // visibility=GONE means LinearLayout skips it (no space). VISIBLE = space reserved.
    // We animate translationY (slide up/down) + alpha for the Telegram feel.

    private val topPanel = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dpToPx(12f), 0, dpToPx(8f), 0)
        visibility = GONE
    }

    private val accentBar = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dpToPx(2f).toFloat()
            setColor(Color.rgb(0, 122, 255))
        }
    }

    private val topPanelTexts = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
    }

    private val topPanelTitle = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        typeface = android.graphics.Typeface.create(
            "sans-serif-medium", android.graphics.Typeface.NORMAL
        )
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelPreview = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelClose = ImageView(context).apply {
        setImageDrawable(CloseCircleDrawable())
        isClickable = true
        isFocusable = true
        background = with(context) {
            val ta = obtainStyledAttributes(
                intArrayOf(android.R.attr.selectableItemBackgroundBorderless)
            )
            ta.getDrawable(0).also { ta.recycle() }
        }
        contentDescription = "Cancel"
        setOnClickListener { closeTopPanel() }
    }

    private val topPanelDivider = View(context).apply { visibility = GONE }
    private val mainDivider = View(context)

    // ── Input row ─────────────────────────────────────────────────────────────

    private val inputRow = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.BOTTOM
        setPadding(dpToPx(4f), dpToPx(8f), dpToPx(6f), dpToPx(8f))
    }

    private val attachButton = ImageView(context).apply {
        setImageDrawable(PaperclipDrawable())
        isClickable = true
        isFocusable = true
        background = with(context) {
            val ta = obtainStyledAttributes(
                intArrayOf(android.R.attr.selectableItemBackgroundBorderless)
            )
            ta.getDrawable(0).also { ta.recycle() }
        }
        setOnClickListener { delegate?.onAttachmentPress() }
        contentDescription = "Attach"
    }

    val editText = EditText(context).apply {
        hint = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines = 6
        minLines = 1
        imeOptions = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        setPadding(dpToPx(14f), dpToPx(10f), dpToPx(14f), dpToPx(10f))
        background = GradientDrawable().apply {
            setColor(Color.rgb(242, 242, 247))
            cornerRadius = dpToPx(20f).toFloat()
        }
    }

    private val sendButton = FrameLayout(context).apply {
        isClickable = true
        isFocusable = true
        setOnClickListener { handleSend() }
    }
    private val sendButtonBg = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.rgb(199, 199, 204))
    }
    private val sendIcon = ImageView(context).apply {
        setImageDrawable(SendArrowDrawable())
        scaleType = ImageView.ScaleType.CENTER_INSIDE
    }

    // ── State ─────────────────────────────────────────────────────────────────

    var topPanelVisibleHeight: Int = 0
        private set

    private var panelAnimator: AnimatorSet? = null

    // ── Init ──────────────────────────────────────────────────────────────────

    init {
        orientation = VERTICAL
        clipChildren = false
        clipToPadding = false
        val btnSize = dpToPx(38f)

        addView(mainDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))

        // Build topPanel
        topPanelTexts.addView(
            topPanelTitle,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        )
        topPanelTexts.addView(
            topPanelPreview,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.topMargin = dpToPx(2f)
            }
        )
        topPanel.addView(
            accentBar,
            LayoutParams(dpToPx(C.REPLY_BAR_WIDTH_DP), dpToPx(32f)).also {
                it.marginEnd = dpToPx(10f)
            }
        )
        topPanel.addView(topPanelTexts, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        topPanel.addView(topPanelClose, LayoutParams(dpToPx(24f), dpToPx(24f)))

        addView(topPanel, LayoutParams(LayoutParams.MATCH_PARENT, topPanelHeight))
        addView(topPanelDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))

        // Build input row
        inputRow.addView(
            attachButton,
            LayoutParams(btnSize, btnSize).also { it.marginEnd = dpToPx(2f) }
        )
        inputRow.addView(editText, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        sendButton.background = sendButtonBg
        sendButton.addView(
            sendIcon,
            FrameLayout.LayoutParams(dpToPx(22f), dpToPx(22f), Gravity.CENTER)
        )
        inputRow.addView(
            sendButton,
            LayoutParams(btnSize, btnSize).also { it.marginStart = dpToPx(6f) }
        )
        addView(inputRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) {
                updateSendButton(s?.isNotBlank() == true)
            }
        })
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        Log.d(IBTAG, "beginReply sender=${info.snapshotSenderName}")
        currentTheme = theme
        val prev = mode
        mode = InputBarMode.Reply(info)
        if (prev is InputBarMode.Edit) editText.setText("")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        Log.d(IBTAG, "beginEdit id=$messageId")
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
        mainDivider.setBackgroundColor(theme.inputBarSeparator)
        topPanelDivider.setBackgroundColor(theme.inputBarSeparator)
        topPanel.setBackgroundColor(theme.replyPanelBackground)
        (accentBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        topPanelTitle.setTextColor(theme.replyPanelSender)
        topPanelPreview.setTextColor(theme.replyPanelText)
        (topPanelClose.drawable as? CloseCircleDrawable)?.circleColor = theme.replyPanelClose
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        (editText.background as? GradientDrawable)?.setColor(theme.inputBarTextViewBg)
        (attachButton.drawable as? PaperclipDrawable)?.iconColor = theme.inputBarTint
        updateSendButton(editText.text?.isNotBlank() == true)
    }

    // ── Mode UI ───────────────────────────────────────────────────────────────

    private fun applyModeToUI(animate: Boolean) {
        val show: Boolean
        val title: String
        val preview: String

        when (val m = mode) {
            is InputBarMode.Normal -> { show = false; title = ""; preview = "" }
            is InputBarMode.Reply  -> {
                show = true
                title = m.info.snapshotSenderName ?: "Message"
                preview = m.info.snapshotText
                    ?: if (m.info.snapshotHasImage) "📷 Photo" else ""
            }
            is InputBarMode.Edit   -> {
                show = true
                title = "Edit Message"
                preview = m.originalText
            }
        }

        Log.d(IBTAG, "applyModeToUI show=$show title='$title' animate=$animate")
        topPanelTitle.text = title
        topPanelPreview.text = preview

        if (animate) animatePanel(show) else setPanelImmediate(show)
    }

    // ── Panel animation ───────────────────────────────────────────────────────

    private fun animatePanel(show: Boolean) {
        panelAnimator?.cancel()
        panelAnimator = null

        Log.d(IBTAG, "animatePanel show=$show topPanelHeight=$topPanelHeight panelVis=${topPanel.visibility}")

        if (show) {
            // Make visible and reserve space immediately
            topPanel.visibility = VISIBLE
            topPanelDivider.visibility = VISIBLE
            topPanel.alpha = 0f
            topPanel.translationY = topPanelHeight.toFloat() * 0.35f
            topPanelVisibleHeight = topPanelHeight
            requestLayout()
            notifyHeightChanged()

            // Animate after next layout pass when the view has real dimensions
            topPanel.post {
                panelAnimator = AnimatorSet().apply {
                    playTogether(
                        ObjectAnimator.ofFloat(topPanel, View.TRANSLATION_Y,
                            topPanel.translationY, 0f),
                        ObjectAnimator.ofFloat(topPanel, View.ALPHA, 0f, 1f)
                    )
                    duration = 260
                    interpolator = DecelerateInterpolator(2.2f)
                    addListener(object : AnimatorListenerAdapter() {
                        override fun onAnimationEnd(a: Animator) {
                            topPanel.translationY = 0f
                            topPanel.alpha = 1f
                        }
                    })
                    start()
                }
            }
        } else {
            panelAnimator = AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(topPanel, View.TRANSLATION_Y,
                        topPanel.translationY, topPanelHeight.toFloat() * 0.2f),
                    ObjectAnimator.ofFloat(topPanel, View.ALPHA, topPanel.alpha, 0f)
                )
                duration = 180
                interpolator = DecelerateInterpolator()
                addListener(object : AnimatorListenerAdapter() {
                    override fun onAnimationEnd(a: Animator) {
                        topPanel.visibility = GONE
                        topPanelDivider.visibility = GONE
                        topPanel.translationY = 0f
                        topPanel.alpha = 1f
                        topPanelVisibleHeight = 0
                        requestLayout()
                        notifyHeightChanged()
                    }
                })
                start()
            }
            topPanelVisibleHeight = 0
            notifyHeightChanged()
        }
    }

    private fun setPanelImmediate(visible: Boolean) {
        Log.d(IBTAG, "setPanelImmediate visible=$visible")
        topPanel.visibility = if (visible) VISIBLE else GONE
        topPanelDivider.visibility = if (visible) VISIBLE else GONE
        topPanel.translationY = 0f
        topPanel.alpha = 1f
        topPanelVisibleHeight = if (visible) topPanelHeight else 0
        notifyHeightChanged()
    }

    private fun notifyHeightChanged() {
        val panelH = topPanelVisibleHeight
        val wSpec = if (width > 0)
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY)
        else
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        val hSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        measure(wSpec, hSpec)
        val mH = measuredHeight
        Log.d(IBTAG, "notifyHeightChanged panelH=$panelH measuredH=$mH")
        if (mH > 0) {
            delegate?.onHeightChanged(mH, panelH)
        } else {
            post {
                measure(wSpec, hSpec)
                val h = if (measuredHeight > 0) measuredHeight else height
                Log.d(IBTAG, "notifyHeightChanged(post) h=$h panelH=$panelH")
                delegate?.onHeightChanged(h, panelH)
            }
        }
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    private fun handleSend() {
        val text = editText.text?.toString()?.trim() ?: return
        if (text.isBlank()) return
        animateSendButton()
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
        val color = if (hasText)
            currentTheme?.inputBarTint ?: Color.rgb(0, 122, 255)
        else
            currentTheme?.let {
                if (it.isDark) Color.rgb(60, 60, 65) else Color.rgb(199, 199, 204)
            } ?: Color.rgb(199, 199, 204)
        sendButtonBg.setColor(color)
        (sendIcon.drawable as? SendArrowDrawable)?.let {
            it.enabled = hasText; it.invalidateSelf()
        }
    }

    private fun animateSendButton() {
        sendButton.animate().scaleX(0.88f).scaleY(0.88f).setDuration(80)
            .withEndAction {
                sendButton.animate().scaleX(1f).scaleY(1f).setDuration(160)
                    .setInterpolator(OvershootInterpolator(3f)).start()
            }.start()
    }

    private fun requestEditFocus() {
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun dpToPx(dp: Float) = context.dpToPx(dp)
}

// ── Drawables ─────────────────────────────────────────────────────────────────

private class SendArrowDrawable : Drawable() {
    var enabled = false
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        val cx = w / 2f; val cy = h / 2f
        paint.strokeWidth = w * 0.12f
        paint.alpha = if (enabled) 255 else 200
        val top = cy - h * 0.22f
        val bot = cy + h * 0.22f
        val wing = w * 0.18f
        c.drawLine(cx, bot, cx, top, paint)
        c.drawLine(cx, top, cx - wing, top + wing, paint)
        c.drawLine(cx, top, cx + wing, top + wing, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

private class PaperclipDrawable : Drawable() {
    var iconColor: Int = Color.rgb(120, 120, 128)
        set(v) { field = v; paint.color = v; invalidateSelf() }
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.rgb(120, 120, 128)
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        paint.strokeWidth = w * 0.09f
        val cx = w * 0.5f
        val path = Path()
        path.addRoundRect(
            cx - w * 0.15f, h * 0.15f,
            cx + w * 0.15f, h * 0.85f,
            w * 0.15f, w * 0.15f,
            Path.Direction.CW
        )
        c.drawPath(path, paint)
        val path2 = Path()
        path2.addRoundRect(
            cx - w * 0.09f, h * 0.28f,
            cx + w * 0.09f, h * 0.76f,
            w * 0.09f, w * 0.09f,
            Path.Direction.CW
        )
        c.drawPath(path2, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

private class CloseCircleDrawable : Drawable() {
    var circleColor: Int = Color.rgb(180, 180, 185)
        set(v) { field = v; invalidateSelf() }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val crossPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val cx = bounds.width() / 2f
        val cy = bounds.height() / 2f
        val r = minOf(cx, cy) - 1f
        val arm = r * 0.30f
        fillPaint.color = circleColor
        crossPaint.strokeWidth = r * 0.22f
        c.drawCircle(cx, cy, r, fillPaint)
        c.drawLine(cx - arm, cy - arm, cx + arm, cy + arm, crossPaint)
        c.drawLine(cx + arm, cy - arm, cx - arm, cy + arm, crossPaint)
    }

    override fun setAlpha(a: Int) { fillPaint.alpha = a; crossPaint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { fillPaint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
