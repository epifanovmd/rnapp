package com.rnapp.rnchatview

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
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
import android.util.Log
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

    // ─── Top panel (reply / edit preview) ────────────────────────────────────

    /** Контейнер панели — высота анимируется от 0 до целевой. */
    private val topPanelContainer = FrameLayout(context)

    /** Внутренний layout с иконкой / текстом / кнопкой закрытия. */
    private val topPanelInner = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dpToPx(12f), 0, dpToPx(8f), 0)
    }

    /** Цветная вертикальная полоска слева (как в Telegram). */
    private val accentBar = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dpToPx(2f).toFloat()
            setColor(Color.rgb(0, 122, 255))
        }
    }

    private val topPanelIcon = ImageView(context).apply {
        // иконка режима (карандаш для Edit, кавычки для Reply)
        scaleType = ImageView.ScaleType.CENTER_INSIDE
    }

    private val topPanelTexts = LinearLayout(context).apply {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
    }

    private val topPanelTitle = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
    }

    private val topPanelPreview = TextView(context).apply {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f)
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
        alpha = 0.7f
    }

    private val topPanelClose = ImageView(context).apply {
        setImageDrawable(TelegramCloseDrawable())
        isClickable = true
        isFocusable = true
        background = with(context) {
            val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
            ta.getDrawable(0).also { ta.recycle() }
        }
        contentDescription = "Cancel"
        setOnClickListener { closeTopPanel() }
    }

    /** Тонкий разделитель между панелью и инпутом. */
    private val topPanelDivider = View(context)

    // ─── Main divider (top of the whole bar) ─────────────────────────────────
    private val mainDivider = View(context)

    // ─── Input row ───────────────────────────────────────────────────────────
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
            val ta = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackgroundBorderless))
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

    /** Кнопка отправки — круглая, с анимированной иконкой-стрелкой. */
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

    // ─── State ───────────────────────────────────────────────────────────────

    var topPanelVisibleHeight: Int = 0
        private set

    /** Целевая высота панели (dp→px), вычисляется в init. */
    private val panelTargetHeight = dpToPx(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

    private var panelHeightAnimator: ValueAnimator? = null
    private var panelFadeAnimator: AnimatorSet? = null

    // ─── Init ─────────────────────────────────────────────────────────────────

    init {
        orientation = VERTICAL

        // Main divider
        addView(mainDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))

        // Build inner panel layout
        topPanelTexts.addView(topPanelTitle,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        topPanelTexts.addView(topPanelPreview,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.topMargin = dpToPx(1.5f)
            })

        val iconSize = dpToPx(20f)
        topPanelInner.addView(topPanelIcon,
            LayoutParams(iconSize, iconSize).also { it.marginEnd = dpToPx(10f) })
        topPanelInner.addView(accentBar,
            LayoutParams(dpToPx(C.REPLY_BAR_WIDTH_DP), dpToPx(32f)).also { it.marginEnd = dpToPx(10f) })
        topPanelInner.addView(topPanelTexts,
            LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        topPanelInner.addView(topPanelClose,
            LayoutParams(dpToPx(32f), dpToPx(32f)))

        // Panel container: FULL height always, content slides in via translationY + clip
        topPanelContainer.clipChildren = true
        topPanelContainer.clipToPadding = true
        topPanelContainer.addView(
            topPanelInner,
            FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, panelTargetHeight, Gravity.BOTTOM)
        )
        // Start collapsed: translate inner fully upward so nothing is visible
        topPanelInner.translationY = -panelTargetHeight.toFloat()

        addView(topPanelContainer, LayoutParams(LayoutParams.MATCH_PARENT, panelTargetHeight))

        // Divider below panel (same height trick)
        addView(topPanelDivider, LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(0.5f)))
        topPanelDivider.visibility = GONE

        // Input row
        val btnSize = dpToPx(38f)
        inputRow.addView(attachButton,
            LayoutParams(btnSize, btnSize).also { it.marginEnd = dpToPx(2f) })
        inputRow.addView(editText,
            LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))

        sendButton.background = sendButtonBg
        sendButton.addView(sendIcon,
            FrameLayout.LayoutParams(dpToPx(22f), dpToPx(22f), Gravity.CENTER))
        inputRow.addView(sendButton,
            LayoutParams(btnSize, btnSize).also { it.marginStart = dpToPx(6f) })

        addView(inputRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Text watcher
        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) { updateSendButton(s?.isNotBlank() == true) }
        })
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        Log.d(IBTAG, "beginReply: replyToId=${info.replyToId}, sender=${info.snapshotSenderName}, text=${info.snapshotText}")
        currentTheme = theme
        val prev = mode
        mode = InputBarMode.Reply(info)
        if (prev is InputBarMode.Edit) editText.setText("")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        Log.d(IBTAG, "beginEdit: messageId=$messageId, text=$text")
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
        topPanelInner.setBackgroundColor(theme.replyPanelBackground)
        topPanelContainer.setBackgroundColor(theme.replyPanelBackground)
        (accentBar.background as? GradientDrawable)?.setColor(theme.replyPanelAccent)
        topPanelTitle.setTextColor(theme.replyPanelSender)
        topPanelPreview.setTextColor(theme.replyPanelText)
        (topPanelClose.drawable as? TelegramCloseDrawable)?.color = theme.replyPanelClose
        (topPanelIcon.drawable as? ModeIconDrawable)?.color = theme.replyPanelSender
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        (editText.background as? GradientDrawable)?.setColor(theme.inputBarTextViewBg)
        (attachButton.drawable as? PaperclipDrawable)?.color = theme.inputBarTint
        updateSendButton(editText.text?.isNotBlank() == true)
    }

    // ─── Mode UI ──────────────────────────────────────────────────────────────

    private fun applyModeToUI(animate: Boolean) {
        val show: Boolean
        val title: String
        val preview: String
        val isEdit: Boolean
        when (val m = mode) {
            is InputBarMode.Normal -> { show = false; title = ""; preview = ""; isEdit = false }
            is InputBarMode.Reply -> {
                show = true; isEdit = false
                title = m.info.snapshotSenderName ?: "Message"
                preview = m.info.snapshotText ?: if (m.info.snapshotHasImage) "📷 Photo" else ""
            }
            is InputBarMode.Edit -> {
                show = true; isEdit = true
                title = "Edit Message"
                preview = m.originalText
            }
        }
        topPanelTitle.text = title
        topPanelPreview.text = preview

        // Swap mode icon
        val iconDrawable = ModeIconDrawable(isEdit)
        iconDrawable.color = currentTheme?.replyPanelSender ?: Color.rgb(0, 122, 255)
        topPanelIcon.setImageDrawable(iconDrawable)

        Log.d(IBTAG, "applyModeToUI: mode=${mode::class.simpleName} show=$show title='$title' preview='$preview' animate=$animate panelTargetHeight=$panelTargetHeight currentContainerH=${topPanelContainer.layoutParams?.height}")
        if (animate) animatePanel(show) else setPanel(show, notify = true)
    }

    // ─── Panel animation (slide + fade) ───────────────────────────────────────

    private fun animatePanel(show: Boolean) {
        panelHeightAnimator?.cancel()
        panelFadeAnimator?.cancel()

        val startTY = topPanelInner.translationY
        val endTY = if (show) 0f else -panelTargetHeight.toFloat()

        Log.d(IBTAG, "animatePanel: show=$show startTY=$startTY endTY=$endTY panelTargetHeight=$panelTargetHeight")

        if (startTY == endTY) {
            Log.d(IBTAG, "animatePanel: already at target, skipping")
            // Still update visible height in case it's out of sync
            topPanelVisibleHeight = if (show) panelTargetHeight else 0
            notifyHeightChanged()
            return
        }

        if (show) {
            topPanelDivider.visibility = VISIBLE
        }

        panelHeightAnimator = ValueAnimator.ofFloat(startTY, endTY).apply {
            duration = 220
            interpolator = DecelerateInterpolator(2f)
            addUpdateListener { va ->
                val ty = va.animatedValue as Float
                topPanelInner.translationY = ty
                // visible height = how much of the panel is revealed
                topPanelVisibleHeight = (panelTargetHeight + ty).toInt().coerceIn(0, panelTargetHeight)
                notifyHeightChanged()
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationStart(a: Animator) {
                    Log.d(IBTAG, "panelAnim START show=$show ty: $startTY→$endTY")
                }
                override fun onAnimationEnd(a: Animator) {
                    topPanelInner.translationY = endTY
                    topPanelVisibleHeight = if (show) panelTargetHeight else 0
                    Log.d(IBTAG, "panelAnim END show=$show visibleH=$topPanelVisibleHeight innerTY=${topPanelInner.translationY}")
                    if (!show) {
                        topPanelDivider.visibility = GONE
                    }
                    notifyHeightChanged()
                }
            })
            start()
        }

        // Fade animation for the content (independent of slide)
        panelFadeAnimator = AnimatorSet().apply {
            if (show) {
                playTogether(
                    ObjectAnimator.ofFloat(topPanelInner, View.ALPHA, 0f, 1f)
                )
                duration = 180
                startDelay = 40
            } else {
                play(ObjectAnimator.ofFloat(topPanelInner, View.ALPHA, topPanelInner.alpha, 0f))
                duration = 100
            }
            interpolator = DecelerateInterpolator()
            start()
        }
    }

    private fun setPanel(visible: Boolean, notify: Boolean) {
        val targetTY = if (visible) 0f else -panelTargetHeight.toFloat()
        Log.d(IBTAG, "setPanel: visible=$visible targetTY=$targetTY")
        topPanelInner.translationY = targetTY
        topPanelInner.alpha = if (visible) 1f else 0f
        topPanelDivider.visibility = if (visible) VISIBLE else GONE
        topPanelVisibleHeight = if (visible) panelTargetHeight else 0
        if (notify) notifyHeightChanged()
    }

    private fun notifyHeightChanged() {
        val panelH = topPanelVisibleHeight
        // InputBarView always has panelTargetHeight in its layout, but visually
        // the panel is clipped by translationY. So effective height =
        // measured height - (panelTargetHeight - panelH) hidden part.
        val wSpec = if (width > 0)
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY)
        else
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        val hSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        measure(wSpec, hSpec)
        val measuredH = measuredHeight
        val hiddenPanelH = panelTargetHeight - panelH
        val effectiveH = (measuredH - hiddenPanelH).coerceAtLeast(0)
        Log.d(IBTAG, "notifyHeightChanged: panelH=$panelH measuredH=$measuredH hiddenPanelH=$hiddenPanelH effectiveH=$effectiveH delegate=${delegate != null}")
        if (effectiveH > 0) {
            delegate?.onHeightChanged(effectiveH, panelH)
        } else {
            Log.w(IBTAG, "notifyHeightChanged: effectiveH=0, deferring to post{}")
            post {
                measure(wSpec, hSpec)
                val mH = if (measuredHeight > 0) measuredHeight else height
                val effH = (mH - hiddenPanelH).coerceAtLeast(0)
                Log.d(IBTAG, "notifyHeightChanged post{}: effH=$effH panelH=$panelH")
                delegate?.onHeightChanged(effH, panelH)
            }
        }
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

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
            is InputBarMode.Reply -> delegate?.onCancelReply()
            is InputBarMode.Edit  -> delegate?.onCancelEdit()
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
            currentTheme?.let { if (it.isDark) Color.rgb(60, 60, 65) else Color.rgb(199, 199, 204) }
                ?: Color.rgb(199, 199, 204)
        sendButtonBg.setColor(color)
        (sendIcon.drawable as? SendArrowDrawable)?.let { it.enabled = hasText; it.invalidateSelf() }
    }

    private fun animateSendButton() {
        sendButton.animate()
            .scaleX(0.88f).scaleY(0.88f)
            .setDuration(80)
            .withEndAction {
                sendButton.animate()
                    .scaleX(1f).scaleY(1f)
                    .setDuration(160)
                    .setInterpolator(OvershootInterpolator(3f))
                    .start()
            }.start()
    }

    private fun requestEditFocus() {
        Log.d(IBTAG, "requestEditFocus")
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun dpToPx(dp: Float) = context.dpToPx(dp)
}

// ─── Drawables ────────────────────────────────────────────────────────────────

/**
 * Иконка-стрелка отправки в стиле Telegram.
 * Когда [enabled] = false — рисует более тусклую версию.
 */
private class SendArrowDrawable : Drawable() {
    var enabled = false
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }
    private val path = Path()

    override fun draw(c: Canvas) {
        val b = bounds
        val w = b.width().toFloat()
        val h = b.height().toFloat()
        val cx = w / 2f
        val cy = h / 2f
        val r = minOf(cx, cy) * 0.52f
        paint.color = Color.WHITE
        paint.alpha = if (enabled) 255 else 200

        // Arrow pointing up-right (Telegram style)
        path.reset()
        path.moveTo(cx - r * 0.10f, cy + r * 0.72f)
        path.lineTo(cx - r * 0.10f, cy - r * 0.28f)
        path.lineTo(cx - r * 0.55f, cy + r * 0.20f)
        path.moveTo(cx - r * 0.10f, cy - r * 0.28f)
        path.lineTo(cx + r * 0.50f, cy - r * 0.28f)

        paint.style = Paint.Style.STROKE
        paint.strokeWidth = w * 0.115f
        paint.strokeCap = Paint.Cap.ROUND
        paint.strokeJoin = Paint.Join.ROUND
        c.drawPath(path, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/**
 * Иконка скрепки для кнопки вложений.
 */
private class PaperclipDrawable : Drawable() {
    var color: Int = Color.rgb(0, 122, 255)
        set(v) { field = v; paint.color = v; invalidateSelf() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.rgb(0, 122, 255)
    }

    override fun draw(c: Canvas) {
        val b = bounds
        val w = b.width().toFloat()
        val h = b.height().toFloat()
        paint.strokeWidth = w * 0.09f

        // Simple paperclip outline
        val cx = w * 0.50f
        val top = h * 0.15f
        val bot = h * 0.82f
        val rx = w * 0.20f
        val ry = h * 0.18f

        val oval = RectF(cx - rx, top, cx + rx, top + ry * 2)
        // Top arc
        c.drawArc(oval, 180f, 180f, false, paint)
        // Side lines
        c.drawLine(cx - rx, top + ry, cx - rx, bot - ry, paint)
        c.drawLine(cx + rx, top + ry, cx + rx, bot - ry, paint)
        // Bottom arc
        val oval2 = RectF(cx - rx, bot - ry * 2, cx + rx, bot)
        c.drawArc(oval2, 0f, 180f, false, paint)
        // Inner shorter line
        val innerX = cx + rx * 0.55f
        c.drawLine(innerX, top + ry * 1.2f, innerX, bot - ry * 1.2f, paint)
        val ovalSmall = RectF(cx - rx * 0.55f, bot - ry * 2.4f, innerX, bot - ry * 1.2f)
        c.drawArc(ovalSmall, 0f, 180f, false, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/**
 * Иконка крестика в стиле Telegram (круг + X).
 */
private class TelegramCloseDrawable : Drawable() {
    var color: Int = Color.rgb(180, 180, 185)
        set(v) { field = v; invalidateSelf() }

    private val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val crossPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val b = bounds
        val cx = b.width() / 2f
        val cy = b.height() / 2f
        val r = minOf(cx, cy) - 1f
        circlePaint.color = color
        c.drawCircle(cx, cy, r, circlePaint)
        val arm = r * 0.30f
        crossPaint.strokeWidth = r * 0.22f
        c.drawLine(cx - arm, cy - arm, cx + arm, cy + arm, crossPaint)
        c.drawLine(cx + arm, cy - arm, cx - arm, cy + arm, crossPaint)
    }

    override fun setAlpha(a: Int) { circlePaint.alpha = a; crossPaint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { circlePaint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/**
 * Иконка режима: карандаш (Edit) или кавычка (Reply).
 */
private class ModeIconDrawable(private val isEdit: Boolean) : Drawable() {
    var color: Int = Color.rgb(0, 122, 255)
        set(v) { field = v; paint.color = v; invalidateSelf() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val path = Path()

    override fun draw(c: Canvas) {
        val b = bounds
        val w = b.width().toFloat()
        val h = b.height().toFloat()
        paint.color = color
        fillPaint.color = color
        paint.strokeWidth = w * 0.10f

        if (isEdit) drawPencil(c, w, h) else drawReplyQuote(c, w, h)
    }

    private fun drawPencil(c: Canvas, w: Float, h: Float) {
        // Pencil body (diagonal line)
        val x1 = w * 0.25f; val y1 = h * 0.72f
        val x2 = w * 0.68f; val y2 = h * 0.28f
        val dx = x2 - x1; val dy = y2 - y1
        val len = Math.sqrt((dx * dx + dy * dy).toDouble()).toFloat()
        val nx = -dy / len * w * 0.09f
        val ny = dx / len * w * 0.09f
        path.reset()
        path.moveTo(x1 + nx, y1 + ny)
        path.lineTo(x2 + nx * 0.5f, y2 + ny * 0.5f)
        path.lineTo(x2 - nx * 0.5f, y2 - ny * 0.5f)
        path.lineTo(x1 - nx, y1 - ny)
        path.close()
        c.drawPath(path, paint)
        // Tip
        c.drawLine(x1 - nx * 0.6f, y1 - ny * 0.6f,
            x1 + nx * 0.6f, y1 + ny * 0.6f, paint)
        // Star at top
        c.drawCircle(x2, y2, w * 0.09f, fillPaint)
    }

    private fun drawReplyQuote(c: Canvas, w: Float, h: Float) {
        // Curved arrow (reply)
        val arrowPath = Path()
        val cx = w * 0.5f; val cy = h * 0.5f
        arrowPath.moveTo(w * 0.72f, cy - h * 0.22f)
        arrowPath.cubicTo(
            w * 0.72f, cy - h * 0.22f,
            w * 0.30f, cy - h * 0.22f,
            w * 0.30f, cy + h * 0.08f
        )
        arrowPath.cubicTo(
            w * 0.30f, cy + h * 0.28f,
            w * 0.50f, cy + h * 0.28f,
            w * 0.65f, cy + h * 0.22f
        )
        c.drawPath(arrowPath, paint)
        // Arrow head
        c.drawLine(w * 0.26f, cy - h * 0.18f, w * 0.30f, cy - h * 0.22f, paint)
        c.drawLine(w * 0.30f, cy - h * 0.22f, w * 0.35f, cy - h * 0.08f, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; fillPaint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
