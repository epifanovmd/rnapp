package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import com.rnapp.rnchatview.ChatLayoutConstants as C

private const val TAG = "InputBarView"

class InputBarView(context: Context) : LinearLayout(context) {

    var delegate: InputBarDelegate? = null

    var mode: InputBarMode = InputBarMode.Normal
        private set

    private var currentTheme: ChatTheme? = null

    val panelHeight: Int = dp(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)
    private var inputRowHeight: Int = 0
    var topPanelVisibleHeight: Int = 0
        private set
    private var heightAnimator: ValueAnimator? = null

    // ── Views ─────────────────────────────────────────────────────────────────

    private val mainDivider = View(context)
    private val topPanel = InputBarTopPanel(context, onCloseClick = ::closeTopPanel)
    private val panelDivider = View(context).apply { visibility = View.GONE }

    private val inputRow = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.BOTTOM
        setPadding(dp(4f), dp(8f), dp(6f), dp(8f))
    }

    private val attachButton = ImageView(context).apply {
        setImageDrawable(PaperclipDrawable())
        isClickable = true
        isFocusable = true
        background = context.selectableItemBgBorderless()
        contentDescription = "Attach"
        setOnClickListener { delegate?.onAttachmentPress() }
    }

    val editText = EditText(context).apply {
        hint = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines = 6
        minLines = 1
        imeOptions = EditorInfo.IME_FLAG_NO_ENTER_ACTION
        setPadding(dp(14f), dp(10f), dp(14f), dp(10f))
        background = GradientDrawable().apply {
            setColor(Color.rgb(242, 242, 247))
            cornerRadius = dp(20f).toFloat()
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

    // ── Инициализация ─────────────────────────────────────────────────────────

    init {
        Log.d(TAG, "init: panelHeight=${panelHeight}px (${C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP}dp)")

        orientation = VERTICAL
        // ВАЖНО: gravity=BOTTOM гарантирует что inputRow всегда прижат к нижнему краю.
        // Без этого при фиксированной высоте (во время анимации) LinearLayout раскладывает
        // детей сверху — topPanel получает h=0, а под inputRow образуется пустота роста.
        gravity = Gravity.BOTTOM
        val btnSize = dp(38f)

        addView(mainDivider, lp(MATCH, dp(0.5f)))
        addView(topPanel, lp(MATCH, WRAP))
        addView(panelDivider, lp(MATCH, dp(0.5f)))

        inputRow.addView(attachButton, lp(btnSize, btnSize).also { it.marginEnd = dp(2f) })
        inputRow.addView(editText, lp(0, WRAP, 1f))
        sendButton.background = sendButtonBg
        sendButton.addView(sendIcon, FrameLayout.LayoutParams(dp(22f), dp(22f), Gravity.CENTER))
        inputRow.addView(sendButton, lp(btnSize, btnSize).also { it.marginStart = dp(6f) })
        addView(inputRow, lp(MATCH, WRAP))

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val hasText = s?.isNotBlank() == true
                Log.v(TAG, "textChanged: hasText=$hasText text='${s?.toString()?.take(40)}'")
                updateSendButton(hasText = hasText)
            }
        })

        editText.setOnEditorActionListener { _, actionId, _ ->
            Log.d(TAG, "editorAction: actionId=$actionId")
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }

        // Ключевой слушатель — именно отсюда аниматор берёт базовую высоту.
        // Если здесь newH=0 или не меняется — аниматор будет считать неверные fromH/toH.
        inputRow.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            val newH = bottom - top
            val oldH = oldBottom - oldTop
            if (newH != oldH) {
                Log.d(TAG, "inputRow layoutChanged: ${oldH}px → ${newH}px (stored was $inputRowHeight)")
            }
            if (newH > 0) inputRowHeight = newH
        }

        // Следим за каждым изменением высоты самого InputBarView —
        // поможет понять когда и почему бар меняет размер неожиданно.
        addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            val newH = bottom - top
            val oldH = oldBottom - oldTop
            if (newH != oldH) {
                Log.d(TAG, "InputBarView layoutChanged: ${oldH}px → ${newH}px | " +
                    "topPanel=${topPanel.visibility.visName()} h=${topPanel.height} | " +
                    "panelDivider=${panelDivider.visibility.visName()} | " +
                    "inputRow.h=${inputRow.height} | " +
                    "lp.h=${layoutParams?.height?.lpName()}")
            }
        }
    }

    // ── Публичный API ─────────────────────────────────────────────────────────

    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        Log.d(TAG, "beginReply: replyToId=${info.replyToId} " +
            "sender='${info.snapshotSenderName}' " +
            "text='${info.snapshotText?.take(40)}' " +
            "hasImage=${info.snapshotHasImage} | " +
            "prevMode=${mode.logName()}")
        currentTheme = theme
        val wasEdit = mode is InputBarMode.Edit
        mode = InputBarMode.Reply(info)
        if (wasEdit) {
            Log.d(TAG, "beginReply: was Edit → clearing editText")
            editText.setText("")
        }
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        Log.d(TAG, "beginEdit: messageId=$messageId text='${text.take(40)}' | prevMode=${mode.logName()}")
        currentTheme = theme
        mode = InputBarMode.Edit(messageId, text)
        editText.setText(text)
        editText.setSelection(text.length)
        Log.d(TAG, "beginEdit: editText populated, calling applyModeToUI | " +
            "editText.text='${editText.text?.toString()?.take(40)}' " +
            "isAttachedToWindow=$isAttachedToWindow")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    fun cancelMode(theme: ChatTheme? = null) {
        Log.d(TAG, "cancelMode: currentMode=${mode.logName()} willReset=${mode != InputBarMode.Normal}")
        if (mode != InputBarMode.Normal) clearAndReset(theme)
    }

    fun applyTheme(theme: ChatTheme) {
        Log.d(TAG, "applyTheme: isDark=${theme.isDark}")
        currentTheme = theme
        setBackgroundColor(theme.inputBarBackground)
        mainDivider.setBackgroundColor(theme.inputBarSeparator)
        panelDivider.setBackgroundColor(theme.inputBarSeparator)
        topPanel.applyTheme(theme)
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        (editText.background as? GradientDrawable)?.setColor(theme.inputBarTextViewBg)
        (attachButton.drawable as? PaperclipDrawable)?.iconColor = theme.inputBarTint
        updateSendButton(hasText = editText.text?.isNotBlank() == true)
    }

    // ── Режим → UI ────────────────────────────────────────────────────────────

    private fun applyModeToUI(animate: Boolean) {
        Log.d(TAG, "applyModeToUI: mode=${mode.logName()} animate=$animate | " +
            "topPanel=${topPanel.visibility.visName()} h=${topPanel.height} measH=${topPanel.measuredHeight} | " +
            "inputRowHeight=$inputRowHeight | " +
            "barH=$height barMeasH=$measuredHeight | " +
            "lp.h=${layoutParams?.height?.lpName()}")

        when (val m = mode) {
            is InputBarMode.Normal -> {
                Log.d(TAG, "applyModeToUI → Normal: hiding topPanel")
                if (animate) animatePanel(show = false) else setPanelImmediate(visible = false)
            }
            is InputBarMode.Reply -> {
                Log.d(TAG, "applyModeToUI → Reply: sender='${m.info.snapshotSenderName}' text='${m.info.snapshotText?.take(30)}'")
                topPanel.bindReply(m.info)
                if (animate) animatePanel(show = true) else setPanelImmediate(visible = true)
            }
            is InputBarMode.Edit -> {
                Log.d(TAG, "applyModeToUI → Edit: originalText='${m.originalText.take(40)}'")
                topPanel.bindEdit(m.originalText)
                // Проверяем что topPanel реально в иерархии и получил данные
                Log.d(TAG, "applyModeToUI → Edit post-bind: " +
                    "topPanel.parent=${topPanel.parent?.javaClass?.simpleName} " +
                    "topPanel.isAttachedToWindow=${topPanel.isAttachedToWindow} " +
                    "topPanel.visibility=${topPanel.visibility.visName()}")
                if (animate) animatePanel(show = true) else setPanelImmediate(visible = true)
            }
        }
    }

    // ── Анимация высоты ───────────────────────────────────────────────────────

    private fun animatePanel(show: Boolean) {
        Log.d(TAG, "animatePanel ENTER: show=$show | " +
            "inputRowHeight=$inputRowHeight panelHeight=$panelHeight | " +
            "barH=$height barMeasH=$measuredHeight | " +
            "topPanel=${topPanel.visibility.visName()} topPanelH=${topPanel.height} topPanelMeasH=${topPanel.measuredHeight} | " +
            "lp.h=${layoutParams?.height?.lpName()} | " +
            "animatorActive=${heightAnimator != null}")

        heightAnimator?.cancel()
        heightAnimator = null

        // Если inputRowHeight=0 — значит inputRow ещё не прошёл layout.
        // Это главная причина неверных fromH/toH и «пустоты под полем».
        val rowH = inputRowHeight.takeIf { it > 0 } ?: run {
            Log.w(TAG, "animatePanel: inputRowHeight=0! Forcing measure. barWidth=$width")
            measure(
                MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
            )
            val panelVisible = topPanel.visibility == View.VISIBLE
            val subtractPanel = if (panelVisible) panelHeight + dp(0.5f) else 0
            val computed = (measuredHeight - subtractPanel).coerceAtLeast(dp(52f))
            Log.w(TAG, "animatePanel: force-measured barMeasH=$measuredHeight " +
                "panelVisible=$panelVisible subtractPanel=$subtractPanel → rowH=$computed")
            computed
        }

        val divH     = dp(0.5f)   // panelDivider
        val mainDivH = dp(0.5f)   // mainDivider

        val closedH = rowH + mainDivH
        val openH   = rowH + mainDivH + panelHeight + divH

        // fromH: берём реальную измеренную высоту если она есть,
        // иначе предполагаем противоположное конечному состоянию
        val fromH = measuredHeight.takeIf { it > 0 } ?: if (show) closedH else openH
        val toH   = if (show) openH else closedH

        Log.d(TAG, "animatePanel CALC: rowH=$rowH divH=$divH mainDivH=$mainDivH | " +
            "closedH=$closedH openH=$openH | " +
            "fromH=$fromH toH=$toH deltaH=${toH - fromH}px | " +
            "topPanelVisibleHeight=$topPanelVisibleHeight")

        if (show) {
            // ВАЖНО: topPanel.visibility=VISIBLE должен быть выставлен ДО setFixedHeight,
            // иначе LinearLayout не включит панель в layout-проход и высота не вырастет.
            Log.d(TAG, "animatePanel: setting topPanel+panelDivider VISIBLE")
            topPanel.visibility = View.VISIBLE
            panelDivider.visibility = View.VISIBLE
        }

        setFixedHeight(fromH)

        heightAnimator = ValueAnimator.ofInt(fromH, toH).apply {
            duration = 240
            interpolator = DecelerateInterpolator(2f)

            addUpdateListener { anim ->
                val h = anim.animatedValue as Int
                topPanelVisibleHeight = (h - closedH - divH).coerceIn(0, panelHeight)
                setFixedHeight(h)
                notifyHeightChanged(h)
                // Логируем старт, конец и каждые ~50мс середину анимации
                val frac = anim.animatedFraction
                if (frac < 0.05f || frac > 0.95f || (frac * 10).toInt() % 3 == 0) {
                    Log.v(TAG, "animator frame: h=$h frac=%.2f topPanelVisible=$topPanelVisibleHeight".format(frac))
                }
            }

            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationStart(a: android.animation.Animator) {
                    Log.d(TAG, "animator START: show=$show ${fromH}px → ${toH}px duration=${duration}ms")
                }
                override fun onAnimationEnd(a: android.animation.Animator) {
                    Log.d(TAG, "animator END: show=$show | barH=$height | " +
                        "topPanel=${topPanel.visibility.visName()} h=${topPanel.height} | " +
                        "inputRow.h=${inputRow.height}")
                    heightAnimator = null
                    finalizePanelState(show, rowH)
                }
                override fun onAnimationCancel(a: android.animation.Animator) {
                    Log.w(TAG, "animator CANCEL: show=$show")
                    heightAnimator = null
                }
            })
            start()
        }
    }

    private fun finalizePanelState(show: Boolean, rowH: Int) {
        Log.d(TAG, "finalizePanelState: show=$show rowH=$rowH | " +
            "barH=$height lp.h=${layoutParams?.height?.lpName()} | " +
            "topPanel=${topPanel.visibility.visName()} h=${topPanel.height}")

        topPanel.visibility    = if (show) View.VISIBLE else View.GONE
        panelDivider.visibility = if (show) View.VISIBLE else View.GONE
        topPanelVisibleHeight  = if (show) panelHeight else 0

        setWrapHeight()

        post {
            val finalH = height.takeIf { it > 0 } ?: measureHeight()
            Log.d(TAG, "finalizePanelState POST: finalH=$finalH | " +
                "topPanel=${topPanel.visibility.visName()} h=${topPanel.height} | " +
                "panelDivider=${panelDivider.visibility.visName()} | " +
                "inputRow.h=${inputRow.height} | " +
                "lp.h=${layoutParams?.height?.lpName()}")
            notifyHeightChanged(finalH)
        }
    }

    private fun setPanelImmediate(visible: Boolean) {
        Log.d(TAG, "setPanelImmediate: visible=$visible | barH=$height topPanel.h=${topPanel.height}")
        heightAnimator?.cancel()
        heightAnimator = null
        topPanel.visibility    = if (visible) View.VISIBLE else View.GONE
        panelDivider.visibility = if (visible) View.VISIBLE else View.GONE
        topPanelVisibleHeight  = if (visible) panelHeight else 0
        setWrapHeight()
        post {
            val finalH = height.takeIf { it > 0 } ?: measureHeight()
            Log.d(TAG, "setPanelImmediate POST: finalH=$finalH barH=$height")
            notifyHeightChanged(finalH)
        }
    }

    private fun setFixedHeight(h: Int) {
        val lp = layoutParams ?: run {
            Log.e(TAG, "setFixedHeight($h): layoutParams=NULL (not attached to parent?)")
            return
        }
        if (lp.height != h) {
            Log.v(TAG, "setFixedHeight: ${lp.height.lpName()} → ${h}px")
            lp.height = h
            layoutParams = lp
        }
    }

    private fun setWrapHeight() {
        val lp = layoutParams ?: run {
            Log.e(TAG, "setWrapHeight: layoutParams=NULL")
            return
        }
        if (lp.height != WRAP) {
            Log.d(TAG, "setWrapHeight: ${lp.height.lpName()} → WRAP_CONTENT")
            lp.height = WRAP
            layoutParams = lp
        }
    }

    private fun measureHeight(): Int {
        measure(
            MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
        )
        Log.d(TAG, "measureHeight: width=$width → $measuredHeight")
        return measuredHeight
    }

    private fun notifyHeightChanged(h: Int) {
        if (h > 0) {
            delegate?.onHeightChanged(h, topPanelVisibleHeight)
        } else {
            Log.w(TAG, "notifyHeightChanged: SKIP h=$h (view not measured yet)")
        }
    }

    // ── Действия пользователя ─────────────────────────────────────────────────

    private fun handleSend() {
        val text = editText.text?.toString()?.trim() ?: run {
            Log.w(TAG, "handleSend: editText.text is null")
            return
        }
        if (text.isBlank()) {
            Log.d(TAG, "handleSend: blank text, ignoring")
            return
        }
        Log.d(TAG, "handleSend: mode=${mode.logName()} text='${text.take(40)}'")
        animateSendButton()
        when (val m = mode) {
            is InputBarMode.Normal -> delegate?.onSendText(text, replyToId = null)
            is InputBarMode.Reply  -> delegate?.onSendText(text, replyToId = m.info.replyToId)
            is InputBarMode.Edit   -> delegate?.onEditText(text, messageId = m.messageId)
        }
        clearAndReset()
    }

    private fun closeTopPanel() {
        Log.d(TAG, "closeTopPanel: mode=${mode.logName()}")
        val prev = mode
        clearAndReset()
        when (prev) {
            is InputBarMode.Reply  -> delegate?.onCancelReply()
            is InputBarMode.Edit   -> delegate?.onCancelEdit()
            is InputBarMode.Normal -> Unit
        }
    }

    private fun clearAndReset(theme: ChatTheme? = null) {
        Log.d(TAG, "clearAndReset: prevMode=${mode.logName()} applyNewTheme=${theme != null}")
        theme?.let { currentTheme = it }
        editText.setText("")
        mode = InputBarMode.Normal
        updateSendButton(hasText = false)
        applyModeToUI(animate = true)
    }

    private fun updateSendButton(hasText: Boolean) {
        val color = if (hasText) {
            currentTheme?.inputBarTint ?: Color.rgb(0, 122, 255)
        } else {
            currentTheme?.let {
                if (it.isDark) Color.rgb(60, 60, 65) else Color.rgb(199, 199, 204)
            } ?: Color.rgb(199, 199, 204)
        }
        Log.v(TAG, "updateSendButton: hasText=$hasText color=#${Integer.toHexString(color)} isDark=${currentTheme?.isDark}")
        sendButtonBg.setColor(color)
        (sendIcon.drawable as? SendArrowDrawable)?.let {
            it.enabled = hasText
            it.invalidateSelf()
        }
    }

    private fun animateSendButton() {
        sendButton.animate().scaleX(0.88f).scaleY(0.88f).setDuration(80)
            .withEndAction {
                sendButton.animate().scaleX(1f).scaleY(1f)
                    .setDuration(160).setInterpolator(OvershootInterpolator(3f)).start()
            }.start()
    }

    private fun requestEditFocus() {
        Log.d(TAG, "requestEditFocus: isAttachedToWindow=$isAttachedToWindow editText.isFocusable=${editText.isFocusable}")
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        val result = imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
        Log.d(TAG, "requestEditFocus: showSoftInput=$result editText.hasFocus=${editText.hasFocus()}")
    }

    // ── onMeasure / onLayout — диагностика неожиданных изменений размеров ─────

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        Log.v(TAG, "onMeasure: specH=${MeasureSpec.getSize(heightMeasureSpec)} " +
            "mode=${MeasureSpec.getMode(heightMeasureSpec).specModeName()} → " +
            "measH=$measuredHeight | " +
            "lp.h=${layoutParams?.height?.lpName()} | " +
            "topPanel=${topPanel.visibility.visName()} measH=${topPanel.measuredHeight} | " +
            "inputRow.measH=${inputRow.measuredHeight}")
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        if (changed) {
            Log.d(TAG, "onLayout: h=${b - t} | " +
                "topPanel=[${topPanel.visibility.visName()} top=${topPanel.top} bot=${topPanel.bottom} h=${topPanel.height}] | " +
                "panelDivider=[${panelDivider.visibility.visName()} top=${panelDivider.top}] | " +
                "inputRow=[top=${inputRow.top} bot=${inputRow.bottom} h=${inputRow.height}]")
        }
    }

    // ── Вспомогательные ───────────────────────────────────────────────────────

    private fun dp(v: Float) = context.dpToPx(v)
    private fun lp(w: Int, h: Int, weight: Float = 0f) = LayoutParams(w, h, weight)

    companion object {
        private const val MATCH = LayoutParams.MATCH_PARENT
        private const val WRAP  = LayoutParams.WRAP_CONTENT
    }
}

// ── Extension-хелперы для читаемых логов ─────────────────────────────────────

private fun Int.visName() = when (this) {
    View.VISIBLE   -> "VISIBLE"
    View.INVISIBLE -> "INVISIBLE"
    View.GONE      -> "GONE"
    else           -> "UNKNOWN($this)"
}

private fun Int.lpName() = when (this) {
    ViewGroup.LayoutParams.MATCH_PARENT -> "MATCH"
    ViewGroup.LayoutParams.WRAP_CONTENT -> "WRAP"
    else -> "${this}px"
}

private fun Int.specModeName() = when (this) {
    View.MeasureSpec.EXACTLY     -> "EXACTLY"
    View.MeasureSpec.AT_MOST     -> "AT_MOST"
    View.MeasureSpec.UNSPECIFIED -> "UNSPECIFIED"
    else                         -> "UNKNOWN($this)"
}

private fun InputBarMode.logName() = when (this) {
    is InputBarMode.Normal -> "Normal"
    is InputBarMode.Reply  -> "Reply(replyToId=${info.replyToId})"
    is InputBarMode.Edit   -> "Edit(messageId=$messageId)"
}
