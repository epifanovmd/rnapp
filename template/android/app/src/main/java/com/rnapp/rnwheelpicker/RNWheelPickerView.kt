package com.rnapp.rnwheelpicker

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import android.util.DisplayMetrics
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.LinearSmoothScroller
import androidx.recyclerview.widget.LinearSnapHelper
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/** Элемент колеса. */
data class WheelItem(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val color: Int?,
)

/**
 * Колесо выбора на RecyclerView: переиспользование строк, снап по центру,
 * цилиндрическая развёртка трансформациями, бесконечная прокрутка и жёсткий
 * упор в недоступные элементы.
 */
class RNWheelPickerView(context: ThemedReactContext) : FrameLayout(context) {

    companion object {
        const val STATE_IDLE = 0
        const val STATE_DRAGGING = 1
        const val STATE_SETTLING = 2

        /** Повторов набора в режиме бесконечной прокрутки. */
        private const val LOOP_CYCLES = 201

        /** Миллисекунд на дюйм: задаёт темп прокрутки на дальние дистанции. */
        private const val SMOOTH_SCROLL_MS_PER_INCH = 100f

        /** Длительность доводки к элементу, мс: именно она ощущается при тапе. */
        private const val TAP_SCROLL_MIN_MS = 140
        private const val TAP_SCROLL_MAX_MS = 320
    }

    // ─── Слушатели ───────────────────────────────────────────────────────────

    var onSelectionChange: ((index: Int, value: String, fromUser: Boolean) -> Unit)? = null
    var onScrollStateChange: ((state: Int, index: Int, value: String) -> Unit)? = null
    var onScrollOffset: ((offset: Double, index: Int) -> Unit)? = null
    var onItemPress: ((index: Int, value: String) -> Unit)? = null

    // ─── Состояние ───────────────────────────────────────────────────────────

    private var itemsList: List<WheelItem> = emptyList()
    private var currentIndex = 0
    private var lastEmittedIndex = -1
    private var allowedRange: IntRange? = null
    private var isApplyingProps = false
    private var lastScrollEventTime = 0L
    private var pendingIndex: Int? = null
    private var itemsDirty = false
    private var pendingSelection: Int? = null
    private var didPosition = false

    // ─── Props ───────────────────────────────────────────────────────────────

    var loop = false
    var wheelEnabled = true
    var stopAtDisabled = true
    var haptics = true
    var scrollEventThrottle = 0

    var itemHeightDp = 44.0
    var visibleItemCount = 5
    var itemSpacingDp = 0.0

    var itemColor: Int = Color.BLACK
    var selectedItemColor: Int? = null
    var disabledItemColor: Int = Color.LTGRAY
    var fontSize = 20.0
    var selectedFontSize = 20.0
    var fontFamily: String? = null
    var fontWeight = "normal"
    var selectedFontWeight = "normal"
    var textAlign = "center"
    var textLines = 1
    var itemPaddingHorizontal = 8.0

    var curvature = 1.0
    var edgeOpacity = 0.25
    var edgeScale = 0.8

    // ─── Вью ─────────────────────────────────────────────────────────────────

    private val rowHeightPx: Int
        get() = PixelUtil.toPixelFromDIP(itemHeightDp + itemSpacingDp).roundToInt().coerceAtLeast(1)

    private val layoutManager = ClampingLayoutManager(context)
    private val adapter = WheelAdapter()
    private val snapHelper = LinearSnapHelper()
    private val recycler = RecyclerView(context)
    private val underlay = WheelOverlay(context, foreground = false)
    private val overlay = WheelOverlay(context, foreground = true)

    init {
        recycler.layoutManager = layoutManager
        recycler.adapter = adapter
        recycler.clipToPadding = false
        recycler.overScrollMode = View.OVER_SCROLL_NEVER
        recycler.itemAnimator = null
        // Колесо не отдаёт прокрутку родителю: иначе её забирает скролл листа.
        recycler.isNestedScrollingEnabled = false
        snapHelper.attachToRecyclerView(recycler)

        recycler.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrolled(view: RecyclerView, dx: Int, dy: Int) {
                applyChildTransforms()
                emitScrollThrottled()
                updateCurrentIndex(notify = false)
            }

            override fun onScrollStateChanged(view: RecyclerView, state: Int) {
                when (state) {
                    RecyclerView.SCROLL_STATE_DRAGGING -> emitState(STATE_DRAGGING)
                    RecyclerView.SCROLL_STATE_SETTLING -> emitState(STATE_SETTLING)
                    RecyclerView.SCROLL_STATE_IDLE -> settle()
                }
            }
        })

        addView(underlay, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        addView(recycler, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        addView(overlay, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    // ─── Публичный API ───────────────────────────────────────────────────────

    /** Набор и позиция применяются вместе в [applyProps], одним проходом. */
    fun setItems(items: List<WheelItem>) {
        itemsList = items
        itemsDirty = true
    }

    fun setSelectedIndex(index: Int) {
        pendingSelection = index
    }

    /** `silent` — прокрутка от props: не считается выбором пользователя. */
    fun scrollToIndex(index: Int, animated: Boolean, silent: Boolean = true) {
        if (itemsList.isEmpty()) return

        val clamped = index.coerceIn(0, itemsList.size - 1)

        if (height == 0) {
            pendingIndex = clamped
            return
        }

        val position = if (loop) itemsList.size * (LOOP_CYCLES / 2) + clamped else clamped

        currentIndex = clamped
        updateAllowedRange()

        if (silent) {
            lastEmittedIndex = clamped
        }

        if (animated) {
            smoothScrollToCenter(position)
        } else {
            layoutManager.scrollToPositionWithOffset(position, 0)
            post { applyChildTransforms() }
        }
    }

    /** Применить пачку props: набор, позиция и оформление за один проход. */
    fun applyProps() {
        layoutManager.clampProvider = { if (stopAtDisabled && !loop) allowedRange else null }

        val reloaded = itemsDirty
        val target = (pendingSelection ?: currentIndex)
            .coerceIn(0, max(itemsList.size - 1, 0))
        val needsScroll = reloaded || target != currentIndex

        itemsDirty = false
        pendingSelection = null
        currentIndex = target

        // Пересборка списка во время анимации оборвала бы её — на остановке
        // список всё равно пересобирается в settle().
        if (recycler.scrollState == RecyclerView.SCROLL_STATE_IDLE) {
            adapter.notifyDataSetChanged()
        }

        updateAllowedRange()
        underlay.invalidate()
        overlay.invalidate()
        requestLayout()

        post {
            updatePadding()

            // Пока колесо под пальцем, props его не перепозиционируют.
            if (needsScroll && recycler.scrollState == RecyclerView.SCROLL_STATE_IDLE) {
                isApplyingProps = true
                // Урезанный набор не едет анимацией: значение то же, сместился индекс.
                scrollToIndex(target, animated = !reloaded && height > 0)
                isApplyingProps = false
            }

            applyChildTransforms()
        }
    }

    private val measureAndLayout = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )
        layout(left, top, right, bottom)
    }

    /**
     * RN не пробрасывает запрос раскладки от нативных детей, поэтому пересборка
     * списка иначе видна только после следующего касания.
     */
    override fun requestLayout() {
        super.requestLayout()
        post(measureAndLayout)
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        updatePadding()

        // Первая раскладка с данными — ставим выбранный элемент по центру.
        if (!didPosition && height > 0 && itemsList.isNotEmpty()) {
            didPosition = true
            scrollToIndex(pendingIndex ?: currentIndex, animated = false)
            pendingIndex = null
        }

        applyChildTransforms()
    }

    override fun onInterceptTouchEvent(ev: MotionEvent?): Boolean =
        if (!wheelEnabled) true else super.onInterceptTouchEvent(ev)

    /**
     * Пока палец на колесе, родительские контейнеры (скролл листа) не
     * перехватывают жест — иначе вертикальное касание уходит им.
     */
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN ->
                parent?.requestDisallowInterceptTouchEvent(wheelEnabled)

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL ->
                parent?.requestDisallowInterceptTouchEvent(false)
        }

        return super.dispatchTouchEvent(ev)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        updatePadding()

        val target = pendingIndex ?: currentIndex

        pendingIndex = null
        post {
            scrollToIndex(target, animated = false)
            applyChildTransforms()
        }
    }

    private fun updatePadding() {
        val pad = max((height - rowHeightPx) / 2, 0)

        recycler.setPadding(0, pad, 0, pad)
    }

    // ─── Выбор ───────────────────────────────────────────────────────────────

    private fun centeredPosition(): Int {
        val view = snapHelper.findSnapView(layoutManager) ?: return -1

        return layoutManager.getPosition(view)
    }

    private fun indexOfPosition(position: Int): Int {
        if (itemsList.isEmpty() || position < 0) return 0
        val index = position % itemsList.size

        return if (index < 0) index + itemsList.size else index
    }

    private fun updateCurrentIndex(notify: Boolean) {
        val position = centeredPosition()

        if (position < 0) return

        val index = indexOfPosition(position)

        if (index != currentIndex) {
            currentIndex = index

            if (haptics) {
                performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
            }
        }

        if (notify) {
            emitChangeIfNeeded()
        }
    }

    /** Выбор нажатием: элемент доезжает до центра и считается выбранным. */
    private fun selectByTap(position: Int, index: Int) {
        val item = itemsList.getOrNull(index) ?: return

        if (!wheelEnabled || item.disabled) return

        val range = allowedRange

        if (range != null && index !in range) return

        onItemPress?.invoke(index, item.value)

        if (loop) {
            smoothScrollToCenter(position)
        } else {
            scrollToIndex(index, animated = true, silent = false)
        }
    }

    /**
     * Штатный `smoothScrollToPosition` доводит элемент до ближайшего края, после
     * чего снап дёргает его в центр. Этот скроллер сразу целится в центр.
     */
    private fun smoothScrollToCenter(position: Int) {
        val scroller = object : LinearSmoothScroller(context) {
            override fun calculateDtToFit(
                viewStart: Int,
                viewEnd: Int,
                boxStart: Int,
                boxEnd: Int,
                snapPreference: Int,
            ): Int = (boxStart + (boxEnd - boxStart) / 2) - (viewStart + (viewEnd - viewStart) / 2)

            override fun calculateSpeedPerPixel(displayMetrics: DisplayMetrics): Float =
                SMOOTH_SCROLL_MS_PER_INCH / displayMetrics.densityDpi

            // Видимая цель доводится этой фазой, поэтому длительность задаётся здесь.
            override fun calculateTimeForDeceleration(dx: Int): Int =
                super.calculateTimeForDeceleration(dx)
                    .coerceIn(TAP_SCROLL_MIN_MS, TAP_SCROLL_MAX_MS)
        }

        scroller.targetPosition = position
        layoutManager.startSmoothScroll(scroller)
    }

    private fun settle() {
        updateCurrentIndex(notify = false)
        updateAllowedRange()
        adapter.notifyDataSetChanged()
        emitChangeIfNeeded()
        emitState(STATE_IDLE)
    }

    /** Границы вокруг текущего выбора: упор в ближайшие недоступные элементы. */
    private fun updateAllowedRange() {
        if (!stopAtDisabled || loop || itemsList.isEmpty()) {
            allowedRange = null

            return
        }

        var lower = currentIndex

        while (lower - 1 >= 0 && !itemsList[lower - 1].disabled) lower--

        var upper = currentIndex

        while (upper + 1 < itemsList.size && !itemsList[upper + 1].disabled) upper++

        // Без недоступных элементов ограничивать нечего — кламп не вмешивается.
        allowedRange = if (lower == 0 && upper == itemsList.lastIndex) null else lower..upper
    }

    // ─── События ─────────────────────────────────────────────────────────────

    private fun valueAt(index: Int) = itemsList.getOrNull(index)?.value ?: ""

    private fun emitChangeIfNeeded() {
        if (currentIndex == lastEmittedIndex || itemsList.isEmpty()) return

        lastEmittedIndex = currentIndex
        onSelectionChange?.invoke(currentIndex, valueAt(currentIndex), !isApplyingProps)
    }

    private fun emitState(state: Int) {
        onScrollStateChange?.invoke(state, currentIndex, valueAt(currentIndex))
    }

    private fun emitScrollThrottled() {
        if (scrollEventThrottle <= 0) return

        val now = System.currentTimeMillis()

        if (now - lastScrollEventTime < scrollEventThrottle) return

        lastScrollEventTime = now

        val first = layoutManager.findFirstVisibleItemPosition()

        if (first == RecyclerView.NO_POSITION) return

        val view = layoutManager.findViewByPosition(first) ?: return
        val offsetPx = recycler.paddingTop - view.top
        val offset = first.toDouble() + offsetPx.toDouble() / rowHeightPx

        onScrollOffset?.invoke(offset, indexOfPosition(offset.roundToInt()))
    }

    // ─── Оформление ──────────────────────────────────────────────────────────

    private fun applyChildTransforms() {
        val viewportCenter = height / 2f
        val radius = max(viewportCenter, rowHeightPx.toFloat())

        for (i in 0 until recycler.childCount) {
            val child = recycler.getChildAt(i)
            val childCenter = (child.top + child.bottom) / 2f
            val distance = childCenter - viewportCenter
            val ratio = min(abs(distance) / radius, 1f)

            child.alpha = 1f - (1f - edgeOpacity.toFloat()) * ratio

            val scale = 1f - (1f - edgeScale.toFloat()) * ratio

            child.scaleX = scale
            child.scaleY = scale

            if (curvature > 0) {
                child.cameraDistance = 8000f * resources.displayMetrics.density
                child.rotationX = -(distance / radius) * 60f * curvature.toFloat()
            } else {
                child.rotationX = 0f
            }
        }
    }

    // ─── Индикатор и шторка ──────────────────────────────────────────────────

    var indicatorVisible = true
    var indicatorColor = Color.LTGRAY
    var indicatorSizeDp = 1.0
    var indicatorStyle = "fill"
    var indicatorRadiusDp = 0.0
    var indicatorInsetDp = 0.0
    var curtainVisible = false
    var curtainColor = Color.TRANSPARENT
    var curtainRadiusDp = 0.0

    /**
     * Оформление колеса. `foreground` — слой поверх строк (линии, рамка,
     * шторка); фоновый слой рисует только заливку полосы выбора, иначе она
     * перекрыла бы текст.
     */
    private inner class WheelOverlay(
        context: ThemedReactContext,
        private val foreground: Boolean,
    ) : View(context) {

        private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        private val rect = RectF()

        init {
            setWillNotDraw(false)
            isClickable = false
            isFocusable = false
        }

        override fun onDraw(canvas: Canvas) {
            val bandHeight = rowHeightPx.toFloat()
            val bandTop = (height - bandHeight) / 2f
            val bandBottom = bandTop + bandHeight
            val inset = PixelUtil.toPixelFromDIP(indicatorInsetDp)
            val thickness = PixelUtil.toPixelFromDIP(indicatorSizeDp)
            val radius = PixelUtil.toPixelFromDIP(indicatorRadiusDp)
            val isFill = indicatorStyle == "fill"

            if (curtainVisible && foreground) {
                paint.style = Paint.Style.FILL
                paint.color = curtainColor

                val curtainRadius = PixelUtil.toPixelFromDIP(curtainRadiusDp)

                rect.set(0f, 0f, width.toFloat(), bandTop)
                canvas.drawRoundRect(rect, curtainRadius, curtainRadius, paint)
                rect.set(0f, bandBottom, width.toFloat(), height.toFloat())
                canvas.drawRoundRect(rect, curtainRadius, curtainRadius, paint)
            }

            if (!indicatorVisible || foreground == isFill) return

            paint.color = indicatorColor

            when (indicatorStyle) {
                "box" -> {
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = thickness
                    rect.set(inset + thickness / 2, bandTop + thickness / 2, width - inset - thickness / 2, bandBottom - thickness / 2)
                    canvas.drawRoundRect(rect, radius, radius, paint)
                }

                "fill" -> {
                    paint.style = Paint.Style.FILL
                    rect.set(inset, bandTop, width - inset, bandBottom)
                    canvas.drawRoundRect(rect, radius, radius, paint)
                }

                else -> {
                    paint.style = Paint.Style.FILL
                    rect.set(inset, bandTop, width - inset, bandTop + thickness)
                    canvas.drawRoundRect(rect, radius, radius, paint)
                    rect.set(inset, bandBottom - thickness, width - inset, bandBottom)
                    canvas.drawRoundRect(rect, radius, radius, paint)
                }
            }
        }
    }

    // ─── Список ──────────────────────────────────────────────────────────────

    private inner class WheelAdapter : RecyclerView.Adapter<WheelAdapter.Holder>() {

        inner class Holder(val text: TextView) : RecyclerView.ViewHolder(text)

        override fun getItemCount(): Int =
            if (itemsList.isEmpty()) 0 else if (loop) itemsList.size * LOOP_CYCLES else itemsList.size

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
            val text = TextView(parent.context)

            text.layoutParams = RecyclerView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                rowHeightPx,
            )
            text.includeFontPadding = false

            return Holder(text)
        }

        override fun onBindViewHolder(holder: Holder, position: Int) {
            val index = indexOfPosition(position)
            val item = itemsList.getOrNull(index) ?: return

            holder.text.setOnClickListener { selectByTap(position, index) }
            val selected = index == currentIndex
            val padding = PixelUtil.toPixelFromDIP(itemPaddingHorizontal).roundToInt()

            holder.text.layoutParams.height = rowHeightPx
            holder.text.text = item.label
            holder.text.maxLines = textLines
            holder.text.setPadding(padding, 0, padding, 0)
            holder.text.textSize = (if (selected) selectedFontSize else fontSize).toFloat()
            holder.text.typeface = typefaceFor(if (selected) selectedFontWeight else fontWeight)
            holder.text.gravity = Gravity.CENTER_VERTICAL or when (textAlign) {
                "left" -> Gravity.START
                "right" -> Gravity.END
                else -> Gravity.CENTER_HORIZONTAL
            }
            holder.text.setTextColor(
                when {
                    item.disabled -> disabledItemColor
                    item.color != null -> item.color
                    selected -> selectedItemColor ?: itemColor
                    else -> itemColor
                },
            )
        }

        private fun typefaceFor(weight: String): Typeface {
            val style = when (weight) {
                "bold", "semibold" -> Typeface.BOLD
                else -> Typeface.NORMAL
            }

            return if (fontFamily.isNullOrEmpty()) {
                Typeface.defaultFromStyle(style)
            } else {
                Typeface.create(fontFamily, style)
            }
        }
    }

    /**
     * Layout manager, ограничивающий прокрутку доступным диапазоном: жест и
     * инерция гасятся ровно на границе с недоступными элементами.
     */
    private class ClampingLayoutManager(context: ThemedReactContext) :
        LinearLayoutManager(context, VERTICAL, false) {

        var clampProvider: (() -> IntRange?)? = null

        override fun scrollVerticallyBy(
            dy: Int,
            recycler: RecyclerView.Recycler?,
            state: RecyclerView.State?,
        ): Int {
            val range = clampProvider?.invoke()
                ?: return super.scrollVerticallyBy(dy, recycler, state)
            val boundary = if (dy > 0) range.last else range.first
            val remaining = distanceToCenter(boundary)
            val limited = if (dy > 0) min(dy, max(remaining, 0)) else max(dy, min(remaining, 0))

            return super.scrollVerticallyBy(limited, recycler, state)
        }

        /** Пиксели до момента, когда элемент окажется по центру вьюпорта. */
        private fun distanceToCenter(position: Int): Int {
            val view = findViewByPosition(position) ?: return Int.MAX_VALUE / 4
            val viewCenter = (getDecoratedTop(view) + getDecoratedBottom(view)) / 2
            val viewportCenter = height / 2

            return viewCenter - viewportCenter
        }
    }
}




