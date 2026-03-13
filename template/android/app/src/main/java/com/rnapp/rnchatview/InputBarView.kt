package com.rnapp.rnchatview

import android.animation.ValueAnimator
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

/**
 * InputBarView — инпут-бар с анимированной панелью цитаты/редактирования.
 *
 * Визуальная структура (сверху вниз):
 *   ──────── mainDivider ────────
 *   [  topPanel: сender / text  ]  ← появляется/скрывается с анимацией высоты
 *   ──────── panelDivider ───────
 *   [ 📎  Message text…   [↑] ]  ← inputRow, всегда виден
 *
 * Анимация: ValueAnimator плавно меняет высоту самого LinearLayout между
 * «только inputRow» и «inputRow + topPanel». Никаких translationY-хаков.
 * onHeightChanged вызывается на каждом кадре — RNChatView двигает recyclerView синхронно.
 */
class InputBarView(context: Context) : LinearLayout(context) {

    var delegate: InputBarDelegate? = null

    var mode: InputBarMode = InputBarMode.Normal
        private set

    private var currentTheme: ChatTheme? = null

    // ── Heights ───────────────────────────────────────────────────────────────

    /** Фиксированная высота панели цитаты/редактирования. */
    val panelHeight: Int = dp(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

    /** Высота нижнего ряда (attach + editText + send). Обновляется при layout. */
    private var inputRowHeight: Int = 0

    /** Текущая логическая высота панели в диапазоне 0..panelHeight. */
    var topPanelVisibleHeight: Int = 0
        private set

    private var heightAnimator: ValueAnimator? = null

    // ── Views ─────────────────────────────────────────────────────────────────

    private val mainDivider = View(context)

    // top panel
    private val topPanel = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(12f), 0, dp(8f), 0)
        visibility = View.GONE
    }
    private val accentBar = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dp(2f).toFloat()
            setColor(Color.rgb(0, 122, 255))
        }
    }
    private val panelTexts = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
    }
    private val panelTitle = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }
    private val panelPreview = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }
    private val panelClose = ImageView(context).apply {
        setImageDrawable(CloseCircleDrawable())
        isClickable = true; isFocusable = true
        background = context.selectableItemBgBorderless()
        contentDescription = "Cancel"
        setOnClickListener { closeTopPanel() }
    }
    private val panelDivider = View(context).apply { visibility = View.GONE }

    // input row
    private val inputRow = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.BOTTOM
        setPadding(dp(4f), dp(8f), dp(6f), dp(8f))
    }
    private val attachButton = ImageView(context).apply {
        setImageDrawable(PaperclipDrawable())
        isClickable = true; isFocusable = true
        background = context.selectableItemBgBorderless()
        setOnClickListener { delegate?.onAttachmentPress() }
        contentDescription = "Attach"
    }
    val editText = EditText(context).apply {
        hint = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines = 6; minLines = 1
        imeOptions = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        setPadding(dp(14f), dp(10f), dp(14f), dp(10f))
        background = GradientDrawable().apply {
            setColor(Color.rgb(242, 242, 247))
            cornerRadius = dp(20f).toFloat()
        }
    }
    private val sendButton = FrameLayout(context).apply {
        isClickable = true; isFocusable = true
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

    // ── Init ──────────────────────────────────────────────────────────────────

    init {
        orientation = VERTICAL
        val btnSize = dp(38f)

        addView(mainDivider, lp(MATCH, dp(0.5f)))

        // topPanel
        panelTexts.addView(panelTitle, lp(MATCH, WRAP))
        panelTexts.addView(panelPreview, lp(MATCH, WRAP).also { it.topMargin = dp(2f) })
        topPanel.addView(accentBar, lp(dp(C.REPLY_BAR_WIDTH_DP), dp(32f)).also { it.marginEnd = dp(10f) })
        topPanel.addView(panelTexts, lp(0, WRAP, 1f))
        topPanel.addView(panelClose, lp(dp(24f), dp(24f)))
        addView(topPanel, lp(MATCH, WRAP))
        addView(panelDivider, lp(MATCH, dp(0.5f)))

        // inputRow
        inputRow.addView(attachButton, lp(btnSize, btnSize).also { it.marginEnd = dp(2f) })
        inputRow.addView(editText, lp(0, WRAP, 1f))
        sendButton.background = sendButtonBg
        sendButton.addView(sendIcon, FrameLayout.LayoutParams(dp(22f), dp(22f), Gravity.CENTER))
        inputRow.addView(sendButton, lp(btnSize, btnSize).also { it.marginStart = dp(6f) })
        addView(inputRow, lp(MATCH, WRAP))

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) { updateSendButton(s?.isNotBlank() == true) }
        })
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }

        // Запоминаем высоту inputRow при каждом его layout
        inputRow.addOnLayoutChangeListener { _, _, t, _, b, _, _, _, _ ->
            val h = b - t
            if (h > 0) inputRowHeight = h
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        currentTheme = theme
        val wasEdit = mode is InputBarMode.Edit
        mode = InputBarMode.Reply(info)
        if (wasEdit) editText.setText("")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
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
        panelDivider.setBackgroundColor(theme.inputBarSeparator)
        (accentBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        panelTitle.setTextColor(theme.replyPanelSender)
        panelPreview.setTextColor(theme.replyPanelText)
        (panelClose.drawable as? CloseCircleDrawable)?.circleColor = theme.replyPanelClose
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        (editText.background as? GradientDrawable)?.setColor(theme.inputBarTextViewBg)
        (attachButton.drawable as? PaperclipDrawable)?.iconColor = theme.inputBarTint
        updateSendButton(editText.text?.isNotBlank() == true)
    }

    // ── Mode → UI ─────────────────────────────────────────────────────────────

    private fun applyModeToUI(animate: Boolean) {
        val show: Boolean
        val title: String
        val preview: String

        when (val m = mode) {
            is InputBarMode.Normal -> { show = false; title = ""; preview = "" }
            is InputBarMode.Reply  -> {
                show = true
                title = m.info.snapshotSenderName ?: "Message"
                preview = m.info.snapshotText ?: if (m.info.snapshotHasImage) "📷 Photo" else ""
            }
            is InputBarMode.Edit   -> {
                show = true
                title = "Edit Message"
                preview = m.originalText
            }
        }

        panelTitle.text = title
        panelPreview.text = preview

        if (animate) animatePanel(show) else setPanelImmediate(show)
    }

    // ── Animation ─────────────────────────────────────────────────────────────

    private fun animatePanel(show: Boolean) {
        heightAnimator?.cancel()
        heightAnimator = null

        // Нам нужна высота inputRow. Если ещё не измерена — используем measuredHeight.
        val rowH = inputRowHeight.takeIf { it > 0 } ?: run {
            measure(
                MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
            )
            (measuredHeight - (if (topPanel.visibility == View.VISIBLE) panelHeight + dp(0.5f) else 0))
                .coerceAtLeast(dp(52f))
        }

        val divH = dp(0.5f)   // panelDivider
        val mainDivH = dp(0.5f)  // mainDivider (уже входит в measuredHeight)

        val closedH = rowH + mainDivH
        val openH   = rowH + mainDivH + panelHeight + divH

        val fromH = measuredHeight.takeIf { it > 0 }
            ?: if (show) closedH else openH
        val toH = if (show) openH else closedH

        // Делаем panelDivider и topPanel VISIBLE сразу при открытии —
        // LinearLayout начнёт их учитывать в высоте, и animator доведёт до нужного значения.
        if (show) {
            topPanel.visibility = View.VISIBLE
            panelDivider.visibility = View.VISIBLE
        }

        // Фиксируем начальную высоту
        setFixedHeight(fromH)

        heightAnimator = ValueAnimator.ofInt(fromH, toH).apply {
            duration = 240
            interpolator = DecelerateInterpolator(2f)
            addUpdateListener { anim ->
                val h = anim.animatedValue as Int
                topPanelVisibleHeight = (h - closedH - divH).coerceIn(0, panelHeight)
                setFixedHeight(h)
                notifyHeightChanged(h)
            }
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(a: android.animation.Animator) {
                    heightAnimator = null
                    finalizePanelState(show, rowH)
                }
                override fun onAnimationCancel(a: android.animation.Animator) {
                    heightAnimator = null
                }
            })
            start()
        }
    }

    private fun finalizePanelState(show: Boolean, rowH: Int) {
        topPanel.visibility = if (show) View.VISIBLE else View.GONE
        panelDivider.visibility = if (show) View.VISIBLE else View.GONE
        topPanelVisibleHeight = if (show) panelHeight else 0
        // Снимаем фиксацию — пусть LinearLayout сам считает WRAP_CONTENT
        setWrapHeight()
        post { notifyHeightChanged(height.takeIf { it > 0 } ?: measureHeight()) }
    }

    private fun setPanelImmediate(visible: Boolean) {
        heightAnimator?.cancel()
        heightAnimator = null
        topPanel.visibility = if (visible) View.VISIBLE else View.GONE
        panelDivider.visibility = if (visible) View.VISIBLE else View.GONE
        topPanelVisibleHeight = if (visible) panelHeight else 0
        setWrapHeight()
        post { notifyHeightChanged(height.takeIf { it > 0 } ?: measureHeight()) }
    }

    private fun setFixedHeight(h: Int) {
        val lp = layoutParams ?: return
        if (lp.height != h) { lp.height = h; layoutParams = lp }
    }

    private fun setWrapHeight() {
        val lp = layoutParams ?: return
        if (lp.height != WRAP) { lp.height = WRAP; layoutParams = lp }
    }

    private fun measureHeight(): Int {
        measure(
            MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
        )
        return measuredHeight
    }

    private fun notifyHeightChanged(h: Int) {
        if (h > 0) delegate?.onHeightChanged(h, topPanelVisibleHeight)
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
        (sendIcon.drawable as? SendArrowDrawable)?.let { it.enabled = hasText; it.invalidateSelf() }
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun dp(v: Float) = context.dpToPx(v)
    private fun lp(w: Int, h: Int, weight: Float = 0f) = LayoutParams(w, h, weight)

    companion object {
        private const val MATCH = LayoutParams.MATCH_PARENT
        private const val WRAP  = LayoutParams.WRAP_CONTENT
    }
}

// ── Extension ─────────────────────────────────────────────────────────────────

private fun Context.selectableItemBgBorderless(): android.graphics.drawable.Drawable? {
    val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
    return ta.getDrawable(0).also { ta.recycle() }
}

// ── Drawables ─────────────────────────────────────────────────────────────────

private class SendArrowDrawable : Drawable() {
    var enabled = false
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE; style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat(); val h = bounds.height().toFloat()
        val cx = w / 2f; val cy = h / 2f
        paint.strokeWidth = w * 0.12f
        paint.alpha = if (enabled) 255 else 200
        val top = cy - h * 0.22f; val bot = cy + h * 0.22f; val wing = w * 0.18f
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
        style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND
        color = Color.rgb(120, 120, 128)
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat(); val h = bounds.height().toFloat()
        paint.strokeWidth = w * 0.09f; val cx = w * 0.5f
        c.drawPath(Path().also {
            it.addRoundRect(cx - w * .15f, h * .15f, cx + w * .15f, h * .85f, w * .15f, w * .15f, Path.Direction.CW)
        }, paint)
        c.drawPath(Path().also {
            it.addRoundRect(cx - w * .09f, h * .28f, cx + w * .09f, h * .76f, w * .09f, w * .09f, Path.Direction.CW)
        }, paint)
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
        color = Color.WHITE; style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val cx = bounds.width() / 2f; val cy = bounds.height() / 2f
        val r = minOf(cx, cy) - 1f; val arm = r * 0.30f
        fillPaint.color = circleColor; crossPaint.strokeWidth = r * 0.22f
        c.drawCircle(cx, cy, r, fillPaint)
        c.drawLine(cx - arm, cy - arm, cx + arm, cy + arm, crossPaint)
        c.drawLine(cx + arm, cy - arm, cx - arm, cy + arm, crossPaint)
    }

    override fun setAlpha(a: Int) { fillPaint.alpha = a; crossPaint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { fillPaint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
