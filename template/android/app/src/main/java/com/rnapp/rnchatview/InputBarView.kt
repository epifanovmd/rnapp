package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.Editable
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
import com.rnapp.rnchatview.ChatLayoutConstants as C

// ─────────────────────────────────────────────────────────────────────────────
// InputBarView.kt
//
// Зона ответственности: оркестрация инпут-бара.
//
// Визуальная структура (сверху вниз):
//   ──────── mainDivider ────────
//   [  InputBarTopPanel          ]  ← появляется/скрывается с анимацией высоты
//   ──────── panelDivider ───────
//   [ 📎   Message text…   [↑] ]  ← inputRow, всегда виден
//
// Ключевая идея анимации:
//   Вместо translationY используем ValueAnimator который пошагово меняет
//   layoutParams.height самого LinearLayout. Это заставляет RecyclerView
//   синхронно сдвигаться через onHeightChanged — без «прыжков» списка.
// ─────────────────────────────────────────────────────────────────────────────

class InputBarView(context: Context) : LinearLayout(context) {

    // ── Внешний контракт ──────────────────────────────────────────────────────

    /**
     * Слушатель событий инпут-бара.
     * Устанавливается из RNChatView после добавления View в иерархию.
     */
    var delegate: InputBarDelegate? = null

    /**
     * Текущий режим инпут-бара: Normal / Reply / Edit.
     * Меняется только через публичные методы [beginReply], [beginEdit], [cancelMode].
     * Приватный set — защита от случайной мутации снаружи.
     */
    var mode: InputBarMode = InputBarMode.Normal
        private set

    /**
     * Активная тема. Нужна при обновлении цвета кнопки отправки
     * (зависит от isDark) и при сбросе через [cancelMode].
     */
    private var currentTheme: ChatTheme? = null

    // ── Размеры ───────────────────────────────────────────────────────────────

    /**
     * Фиксированная высота верхней панели (reply/edit) в пикселях.
     * Константа из ChatLayoutConstants, вычисляется один раз при инициализации.
     * Используется как целевая высота в ValueAnimator и для расчёта topPanelVisibleHeight.
     */
    val panelHeight: Int = dp(C.INPUT_BAR_REPLY_PANEL_HEIGHT_DP)

    /**
     * Высота нижней строки (attach + поле ввода + send) в пикселях.
     * Обновляется в addOnLayoutChangeListener при каждом layout inputRow.
     * Нужна аниматору чтобы знать базовую высоту «закрытого» состояния.
     */
    private var inputRowHeight: Int = 0

    /**
     * Сколько пикселей верхней панели сейчас показано (диапазон 0..panelHeight).
     * Пересчитывается на каждом кадре анимации и передаётся в onHeightChanged.
     * RNChatView использует это значение чтобы компенсировать скролл списка.
     */
    var topPanelVisibleHeight: Int = 0
        private set

    /**
     * Текущий запущенный аниматор высоты.
     * Хранится чтобы можно было отменить его перед запуском нового
     * (например: быстро открыть reply → сразу edit).
     * null когда анимация не активна.
     */
    private var heightAnimator: ValueAnimator? = null

    // ── Views ─────────────────────────────────────────────────────────────────

    /** Разделитель между контентом выше и инпут-баром. Всегда виден. */
    private val mainDivider = View(context)

    /** Верхняя панель с данными цитаты или редактирования. */
    private val topPanel = InputBarTopPanel(context, onCloseClick = ::closeTopPanel)

    /** Разделитель между верхней панелью и строкой ввода. Виден только когда панель открыта. */
    private val panelDivider = View(context).apply { visibility = View.GONE }

    // Строка ввода (attach + editText + send)
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

    /** Поле ввода текста. public val — RNChatView может читать содержимое если нужно. */
    val editText = EditText(context).apply {
        hint = "Message"
        setTextSize(TypedValue.COMPLEX_UNIT_SP, C.INPUT_TEXT_SIZE_SP)
        maxLines = 6
        minLines = 1
        // IME_FLAG_NO_ENTER_ACTION: Enter не отправляет — используется для переноса строки
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

    /**
     * Фон кнопки отправки — овальный GradientDrawable.
     * Хранится отдельно чтобы менять цвет без пересоздания фона:
     * серый когда поле пустое, акцентный когда есть текст.
     */
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
        orientation = VERTICAL
        val btnSize = dp(38f)

        // Порядок добавления определяет порядок отображения сверху вниз
        addView(mainDivider, lp(MATCH, dp(0.5f)))
        addView(topPanel, lp(MATCH, WRAP))
        addView(panelDivider, lp(MATCH, dp(0.5f)))

        // Сборка строки ввода
        inputRow.addView(attachButton, lp(btnSize, btnSize).also { it.marginEnd = dp(2f) })
        inputRow.addView(editText, lp(0, WRAP, 1f))
        sendButton.background = sendButtonBg
        sendButton.addView(
            sendIcon,
            FrameLayout.LayoutParams(dp(22f), dp(22f), Gravity.CENTER)
        )
        inputRow.addView(sendButton, lp(btnSize, btnSize).also { it.marginStart = dp(6f) })
        addView(inputRow, lp(MATCH, WRAP))

        // Обновляем цвет кнопки отправки при каждом изменении текста
        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) {
                updateSendButton(hasText = s?.isNotBlank() == true)
            }
        })

        // IME_ACTION_SEND срабатывает на клавиатурах с кнопкой «Отправить»
        editText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) { handleSend(); true } else false
        }

        // Запоминаем актуальную высоту inputRow для использования в аниматоре
        inputRow.addOnLayoutChangeListener { _, _, top, _, bottom, _, _, _, _ ->
            val h = bottom - top
            if (h > 0) inputRowHeight = h
        }
    }

    // ── Публичный API ─────────────────────────────────────────────────────────

    /**
     * Переводит инпут-бар в режим ответа на сообщение.
     * Если до этого был режим редактирования — очищает поле ввода,
     * так как текст редактируемого сообщения больше не актуален.
     *
     * @param info  данные цитируемого сообщения для отображения в панели
     * @param theme текущая тема (нужна для правильного цвета кнопки)
     */
    fun beginReply(info: ReplyInfo, theme: ChatTheme) {
        currentTheme = theme
        val wasEdit = mode is InputBarMode.Edit
        mode = InputBarMode.Reply(info)
        if (wasEdit) editText.setText("")
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    /**
     * Переводит инпут-бар в режим редактирования сообщения.
     * Подставляет оригинальный текст в поле ввода и перемещает курсор в конец.
     *
     * @param messageId id сообщения, которое будет отредактировано
     * @param text      оригинальный текст для подстановки в поле
     * @param theme     текущая тема
     */
    fun beginEdit(messageId: String, text: String, theme: ChatTheme) {
        currentTheme = theme
        mode = InputBarMode.Edit(messageId, text)
        editText.setText(text)
        editText.setSelection(text.length) // курсор в конец
        applyModeToUI(animate = true)
        requestEditFocus()
    }

    /**
     * Сбрасывает режим в Normal (скрывает верхнюю панель, очищает поле).
     * Ничего не делает если уже Normal — защита от лишних анимаций.
     *
     * @param theme опциональная новая тема — применится вместе со сбросом
     */
    fun cancelMode(theme: ChatTheme? = null) {
        if (mode != InputBarMode.Normal) clearAndReset(theme)
    }

    /**
     * Применяет новую тему ко всем дочерним элементам.
     * Вызывается из RNChatView.setTheme().
     */
    fun applyTheme(theme: ChatTheme) {
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

    /**
     * Синхронизирует состояние всех вью с текущим [mode].
     * Решает показывать ли верхнюю панель и что в ней написать,
     * затем запускает анимацию или применяет состояние мгновенно.
     *
     * @param animate true → плавная анимация высоты, false → мгновенный переход
     */
    private fun applyModeToUI(animate: Boolean) {
        when (val m = mode) {
            is InputBarMode.Normal -> {
                if (animate) animatePanel(show = false) else setPanelImmediate(visible = false)
            }
            is InputBarMode.Reply -> {
                topPanel.bindReply(m.info)
                if (animate) animatePanel(show = true) else setPanelImmediate(visible = true)
            }
            is InputBarMode.Edit -> {
                topPanel.bindEdit(m.originalText)
                if (animate) animatePanel(show = true) else setPanelImmediate(visible = true)
            }
        }
    }

    // ── Анимация высоты ───────────────────────────────────────────────────────

    /**
     * Плавно показывает или скрывает верхнюю панель через анимацию высоты.
     *
     * Механика:
     * 1. Вычисляем closedH (только inputRow) и openH (inputRow + панель + разделитель).
     * 2. Фиксируем текущую высоту через layoutParams.height — иначе WRAP_CONTENT
     *    мешает аниматору (View сама меняла бы высоту под контент).
     * 3. При открытии сразу делаем topPanel VISIBLE — чтобы LinearLayout
     *    включил её в расчёт высоты при каждом кадре.
     * 4. На каждом кадре обновляем topPanelVisibleHeight и сообщаем делегату —
     *    RNChatView компенсирует скролл RecyclerView.
     * 5. По окончании снимаем фиксацию высоты (возвращаем WRAP_CONTENT).
     *
     * @param show true → открыть панель, false → закрыть
     */
    private fun animatePanel(show: Boolean) {
        heightAnimator?.cancel()
        heightAnimator = null

        // Высота нижней строки — база для расчёта closedH.
        // Если inputRow ещё не прошёл layout, форсируем измерение.
        val rowH = inputRowHeight.takeIf { it > 0 } ?: run {
            measure(
                MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
                MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
            )
            // Вычитаем высоту панели если она сейчас видна
            val subtractPanel = if (topPanel.visibility == View.VISIBLE)
                panelHeight + dp(0.5f) else 0
            (measuredHeight - subtractPanel).coerceAtLeast(dp(52f))
        }

        val divH = dp(0.5f)     // высота panelDivider
        val mainDivH = dp(0.5f) // высота mainDivider

        val closedH = rowH + mainDivH          // высота без панели
        val openH = rowH + mainDivH + panelHeight + divH  // высота с панелью

        // Стартовая высота = фактическая если измерена, иначе противоположная конечная
        val fromH = measuredHeight.takeIf { it > 0 }
            ?: if (show) closedH else openH
        val toH = if (show) openH else closedH

        // При открытии панель должна быть VISIBLE до старта анимации —
        // иначе LinearLayout не учтёт её в layout и высота не дорастёт до openH
        if (show) {
            topPanel.visibility = View.VISIBLE
            panelDivider.visibility = View.VISIBLE
        }

        setFixedHeight(fromH)

        heightAnimator = ValueAnimator.ofInt(fromH, toH).apply {
            duration = 240
            interpolator = DecelerateInterpolator(2f)

            addUpdateListener { anim ->
                val h = anim.animatedValue as Int
                // Сколько пикселей панели видно прямо сейчас — нужно для компенсации скролла
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

    /**
     * Завершает анимацию: устанавливает финальную видимость и снимает фиксацию высоты.
     * После снятия фиксации LinearLayout самостоятельно считает высоту через WRAP_CONTENT.
     *
     * @param show  финальное состояние панели
     * @param rowH  высота inputRow (не используется напрямую, но нужна для согласованности)
     */
    private fun finalizePanelState(show: Boolean, rowH: Int) {
        topPanel.visibility = if (show) View.VISIBLE else View.GONE
        panelDivider.visibility = if (show) View.VISIBLE else View.GONE
        topPanelVisibleHeight = if (show) panelHeight else 0
        setWrapHeight()
        // post нужен: после setWrapHeight новый layout ещё не прошёл, height ещё старый
        post { notifyHeightChanged(height.takeIf { it > 0 } ?: measureHeight()) }
    }

    /**
     * Мгновенно применяет видимость панели без анимации.
     * Используется при первом рендере или программном сбросе без анимации.
     */
    private fun setPanelImmediate(visible: Boolean) {
        heightAnimator?.cancel()
        heightAnimator = null
        topPanel.visibility = if (visible) View.VISIBLE else View.GONE
        panelDivider.visibility = if (visible) View.VISIBLE else View.GONE
        topPanelVisibleHeight = if (visible) panelHeight else 0
        setWrapHeight()
        post { notifyHeightChanged(height.takeIf { it > 0 } ?: measureHeight()) }
    }

    /**
     * Фиксирует высоту View через layoutParams.
     * Вызывает requestLayout только если высота реально изменилась — оптимизация.
     */
    private fun setFixedHeight(h: Int) {
        val lp = layoutParams ?: return
        if (lp.height != h) { lp.height = h; layoutParams = lp }
    }

    /**
     * Возвращает высоту к WRAP_CONTENT — LinearLayout снова сам управляет высотой.
     * Вызывается после завершения анимации.
     */
    private fun setWrapHeight() {
        val lp = layoutParams ?: return
        if (lp.height != WRAP) { lp.height = WRAP; layoutParams = lp }
    }

    /**
     * Принудительно измеряет View и возвращает measuredHeight.
     * Используется как fallback когда height == 0 (до первого layout).
     */
    private fun measureHeight(): Int {
        measure(
            MeasureSpec.makeMeasureSpec(width.takeIf { it > 0 } ?: 0, MeasureSpec.UNSPECIFIED),
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
        )
        return measuredHeight
    }

    /**
     * Сообщает делегату об изменении высоты инпут-бара.
     * Фильтрует нулевые значения — они означают что View ещё не измерена.
     */
    private fun notifyHeightChanged(h: Int) {
        if (h > 0) delegate?.onHeightChanged(h, topPanelVisibleHeight)
    }

    // ── Действия пользователя ─────────────────────────────────────────────────

    /**
     * Обрабатывает нажатие кнопки «Отправить».
     * Проверяет что текст не пустой, запускает анимацию кнопки,
     * уведомляет делегата в зависимости от текущего режима, затем сбрасывает бар.
     */
    private fun handleSend() {
        val text = editText.text?.toString()?.trim() ?: return
        if (text.isBlank()) return

        animateSendButton()

        when (val m = mode) {
            is InputBarMode.Normal -> delegate?.onSendText(text, replyToId = null)
            is InputBarMode.Reply  -> delegate?.onSendText(text, replyToId = m.info.replyToId)
            is InputBarMode.Edit   -> delegate?.onEditText(text, messageId = m.messageId)
        }

        clearAndReset()
    }

    /**
     * Обрабатывает нажатие кнопки «✕» на верхней панели.
     * Сначала запоминает предыдущий режим, затем сбрасывает бар,
     * после чего уведомляет делегата — в этом порядке, чтобы делегат
     * получил событие уже после того как UI обновлён.
     */
    private fun closeTopPanel() {
        val prev = mode
        clearAndReset()
        when (prev) {
            is InputBarMode.Reply  -> delegate?.onCancelReply()
            is InputBarMode.Edit   -> delegate?.onCancelEdit()
            is InputBarMode.Normal -> Unit
        }
    }

    /**
     * Очищает поле ввода, сбрасывает режим в Normal и запускает анимацию закрытия панели.
     *
     * @param theme опциональная тема — если передана, применяется до сброса
     *              (используется когда RNChatView меняет тему вместе со сбросом)
     */
    private fun clearAndReset(theme: ChatTheme? = null) {
        theme?.let { currentTheme = it }
        editText.setText("")
        mode = InputBarMode.Normal
        updateSendButton(hasText = false)
        applyModeToUI(animate = true)
    }

    /**
     * Обновляет цвет фона и прозрачность иконки кнопки отправки.
     * Активный цвет — акцентный из темы (или синий по умолчанию).
     * Неактивный — серый (зависит от isDark чтобы не сливаться с фоном в тёмной теме).
     *
     * @param hasText true если поле ввода содержит непустой текст
     */
    private fun updateSendButton(hasText: Boolean) {
        val color = if (hasText) {
            currentTheme?.inputBarTint ?: Color.rgb(0, 122, 255)
        } else {
            currentTheme?.let {
                if (it.isDark) Color.rgb(60, 60, 65) else Color.rgb(199, 199, 204)
            } ?: Color.rgb(199, 199, 204)
        }
        sendButtonBg.setColor(color)
        (sendIcon.drawable as? SendArrowDrawable)?.let {
            it.enabled = hasText
            it.invalidateSelf()
        }
    }

    /**
     * Анимирует кнопку отправки — лёгкое «вжатие» и отскок с Overshoot.
     * Чисто визуальный эффект, никак не влияет на логику отправки.
     */
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

    /**
     * Запрашивает фокус для поля ввода и программно показывает клавиатуру.
     * SHOW_IMPLICIT — «мягкий» запрос: система может проигнорировать
     * если сочтёт что клавиатура сейчас неуместна (например, в split-screen).
     */
    private fun requestEditFocus() {
        editText.requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    // ── Вспомогательные ───────────────────────────────────────────────────────

    private fun dp(v: Float) = context.dpToPx(v)
    private fun lp(w: Int, h: Int, weight: Float = 0f) = LayoutParams(w, h, weight)

    companion object {
        private const val MATCH = LayoutParams.MATCH_PARENT
        private const val WRAP  = LayoutParams.WRAP_CONTENT
    }
}
