package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.core.view.animation.PathInterpolatorCompat
import androidx.recyclerview.widget.LinearSmoothScroller
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.rnapp.rnchatview.ChatLayoutConstants as C
import kotlin.math.abs

private const val TAG = "RNChatView"

// ─── RNChatView ───────────────────────────────────────────────────────────────
//
// Главный View-оркестратор.
//
// Архитектурные принципы:
//   • Единственный источник истины — messageIndex (Map<id, ChatMessage>)
//   • Reply резолвится ВСЕГДА из живого messageIndex — данные всегда актуальны
//   • applyXxx() методы отвечают за данные; RecyclerView сам управляет layout
//   • alpha ViewHolder-ов сбрасывается в onBindViewHolder и onViewRecycled
//   • scrollBy(0,0) после DiffUtil гарантирует layout pass при itemAnimator=null

class RNChatView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    // ─── UI ───────────────────────────────────────────────────────────────

    private val recyclerView:  RecyclerView
    private val adapter:       ChatSectionedAdapter
    private val layoutManager: LinearLayoutManager
    private val inputBar:      InputBarView
    private val emptyStateView: EmptyStateView
    private val fabButton:     FabButton
    private var contextMenu:   ContextMenuView? = null

    // ─── Domain state ─────────────────────────────────────────────────────

    private var sections:     List<MessageSection>     = emptyList()
    private var messageIndex: Map<String, ChatMessage> = emptyMap()
    private var actions:      List<MessageAction>      = emptyList()
    private var emojis:       List<String>             = emptyList()
    private var theme:        ChatTheme                = ChatTheme.light()
    private var isLoading:    Boolean                  = false

    // ─── Scroll state ─────────────────────────────────────────────────────

    private var topThreshold:             Int = context.dpToPx(200f)
    private var scrollToBottomThreshold:  Int = context.dpToPx(150f)
    private var collectionExtraInsetTop:  Int = 0
    private var collectionExtraInsetBottom: Int = 0

    private var lastKnownCount:         Int     = 0
    private var waitingForNewMessages:  Boolean = false

    // Initial scroll — выполняется ровно один раз после первых данных.
    private var pendingInitialScrollId: String? = null
    private var initialScrollDone:      Boolean = false
    private var pendingInitialScroll:   Boolean = false

    private var isProgrammaticScroll: Boolean = false
    private var isUserDragging:       Boolean = false
    private var fabVisible:           Boolean = false

    // Visibility debounce
    private val pendingVisibleIds    = mutableSetOf<String>()
    private val visibilityDebounceMs = 300L
    private val visibilityRunnable   = Runnable { flushVisibleIds() }

    // ─── Init ─────────────────────────────────────────────────────────────

    init {
        clipChildren  = false   // позволяет topPanel InputBarView рисоваться поверх RecyclerView
        clipToPadding = false
        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        adapter       = ChatSectionedAdapter(context)

        recyclerView = RecyclerView(context).apply {
            this.layoutManager = this@RNChatView.layoutManager
            this.adapter       = this@RNChatView.adapter
            setHasFixedSize(false)
            overScrollMode = OVER_SCROLL_NEVER
            itemAnimator   = null
            clipToPadding  = false
            layoutParams   = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            // Скрываем до завершения initial scroll — предотвращает мерцание когда
            // список сначала рендерится в неправильной позиции (stackFromEnd или top),
            // а затем прыгает к нужному сообщению. Показываем в revealAfterInitialScroll().
            alpha = 0f
        }

        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.gravity = Gravity.BOTTOM
            }
        }

        emptyStateView = EmptyStateView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            visibility   = View.GONE
        }

        fabButton = FabButton(context).apply {
            layoutParams = LayoutParams(
                context.dpToPx(C.FAB_SIZE_DP),
                context.dpToPx(C.FAB_SIZE_DP)
            ).also {
                it.gravity     = Gravity.END or Gravity.BOTTOM
                it.marginEnd   = context.dpToPx(C.FAB_MARGIN_END_DP)
                it.bottomMargin = context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
            }
            alpha      = 0f
            visibility = View.INVISIBLE
            setOnClickListener { scrollToBottom(animated = true) }
        }

        addView(recyclerView)
        addView(inputBar)
        addView(emptyStateView)
        addView(fabButton)

        inputBar.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            if (bottom - top != oldBottom - oldTop) updateRecyclerPadding()
        }

        adapter.onMessagePress     = { id -> sendEvent("onMessagePress", args { putString("messageId", id) }) }
        adapter.onMessageLongPress = { id, bubbleAnchor, _ -> showContextMenu(id, bubbleAnchor) }
        adapter.onReplyPress       = { replyId ->
            sendEvent("onReplyMessagePress", args { putString("messageId", replyId) })
            scrollToMessage(replyId, ChatScrollPosition.CENTER, animated = true, highlight = true)
        }

        // Delegate и scroll listener после завершения init чтобы избежать утечки this
        post {
            inputBar.delegate = inputBarDelegate
            recyclerView.addOnScrollListener(scrollListener)
        }
    }

    // ─── Layout ───────────────────────────────────────────────────────────

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        updateRecyclerPadding()
        updateFabPosition()
        if (pendingInitialScroll) {
            pendingInitialScroll = false
            recyclerView.post {
                doInitialScroll()
                // Сбрасываем stackFromEnd после скролла чтобы нормальное поведение вернулось
                layoutManager.stackFromEnd = false
            }
        }
    }

    private fun updateRecyclerPadding() {
        val newBottom = inputBar.height + collectionExtraInsetBottom + context.dpToPx(C.COLLECTION_BOTTOM_PADDING_DP)
        val newTop    = context.dpToPx(C.COLLECTION_TOP_PADDING_DP) + collectionExtraInsetTop
        if (recyclerView.paddingBottom == newBottom && recyclerView.paddingTop == newTop) return
        recyclerView.setPadding(0, newTop, 0, newBottom)
        // Смещаем текст EmptyStateView вверх ровно на высоту inputBar,
        // чтобы он оказался по центру видимой области над панелью ввода.
        emptyStateView.setBottomOffset(inputBar.height + collectionExtraInsetBottom)
    }

    private fun updateFabPosition() {
        val inputH = inputBar.height.takeIf { it > 0 } ?: return
        val lp     = fabButton.layoutParams as? LayoutParams ?: return
        val newMargin = inputH + context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
        if (lp.bottomMargin == newMargin) return
        lp.bottomMargin = newMargin
        fabButton.layoutParams = lp
    }

    // ─── Props API ────────────────────────────────────────────────────────

    fun setMessages(newMessages: List<ChatMessage>) {

        // Для первой загрузки без initialScrollId — stackFromEnd=true ДО applyStrategy.
        // Это заставляет LinearLayoutManager разложить items снизу с первого layout pass.
        // Работало ранее. Если придёт initialScrollId — сбросим stackFromEnd в setInitialScrollId.
        if (!initialScrollDone && newMessages.isNotEmpty() && pendingInitialScrollId == null) {
            layoutManager.stackFromEnd = true
        }

        val strategy = resolveStrategy(newMessages, messageIndex, sections)
        applyStrategy(strategy)
        updateLoadingState()
        updateFabVisibility(animated = false)

        lastKnownCount = newMessages.size

        // После prepend-вставки offset мог вырасти из-за anchor-компенсации.
        // Проверяем порог после layout — если всё ещё у верха, запускаем следующую подгрузку.
        // Если isLoading ещё true — не проверяем: setIsLoading(false) сделает это сам.
        if (strategy is UpdateStrategy.Prepend && !isLoading) {
            Log.d(TAG, "setMessages [Prepend]: prependedCount=${strategy.prependedCount} totalItems=${newMessages.size} — scheduling checkAndFireReachTopIfNeeded")
            recyclerView.post { checkAndFireReachTopIfNeeded() }
        } else if (strategy is UpdateStrategy.Prepend) {
            Log.d(TAG, "setMessages [Prepend]: prependedCount=${strategy.prependedCount} totalItems=${newMessages.size} — skip check, isLoading=true, setIsLoading(false) will handle it")
        }

        if (!initialScrollDone && newMessages.isNotEmpty()) {
            initialScrollDone = true
            performInitialScroll()
        }
    }

    fun setActions(newActions: List<MessageAction>) { actions = newActions }

    fun setEmojiReactions(newEmojis: List<String>) { emojis = newEmojis }

    fun setTheme(name: String) {
        theme = ChatTheme.from(name)
        adapter.theme = theme
        applyThemeToViews()
    }

    fun setIsLoading(loading: Boolean) {
        Log.d(TAG, "setIsLoading: $loading | waiting=$waitingForNewMessages")
        isLoading = loading
        if (!loading) {
            waitingForNewMessages = false
            // После завершения загрузки проверяем — вдруг пользователь уже у самого верха.
            // Такое случается при быстром скролле: onReachTop сработал, данные загрузились,
            // но offset уже 0 и dy < 0 больше не генерируется — следующая подгрузка не запустится.
            // Делаем проверку через post чтобы новые items успели лечь в layout.
            recyclerView.post { checkAndFireReachTopIfNeeded() }
        }
        updateLoadingState()
    }

    private fun checkAndFireReachTopIfNeeded() {
        val distanceFromTop = recyclerView.computeVerticalScrollOffset()
        Log.d(TAG, "checkAndFireReachTopIfNeeded: distanceFromTop=$distanceFromTop threshold=$topThreshold isLoading=$isLoading waiting=$waitingForNewMessages")
        if (isLoading) { Log.d(TAG, "checkAndFireReachTopIfNeeded [SKIP]: isLoading=true"); return }
        if (waitingForNewMessages) { Log.d(TAG, "checkAndFireReachTopIfNeeded [SKIP]: waitingForNewMessages=true"); return }
        if (distanceFromTop >= topThreshold) { Log.d(TAG, "checkAndFireReachTopIfNeeded [SKIP]: distanceFromTop=$distanceFromTop >= threshold=$topThreshold"); return }
        waitingForNewMessages = true
        Log.d(TAG, "onReachTop [check]: distanceFromTop=$distanceFromTop threshold=$topThreshold isLoading=$isLoading")
        sendEvent("onReachTop", args { putDouble("distanceFromTop", distanceFromTop.toDouble()) })
    }

    fun setTopThreshold(value: Int) { topThreshold = context.dpToPx(value.toFloat()) }

    fun setScrollToBottomThreshold(value: Int) { scrollToBottomThreshold = context.dpToPx(value.toFloat()) }

    fun setInitialScrollId(id: String?) {
        if (id == null) return

        if (!initialScrollDone) {
            // setMessages ещё не было — просто сохраняем
            pendingInitialScrollId = id
        } else if (pendingInitialScroll) {
            // setMessages было, onLayout ещё нет (именно этот случай из логов).
            // Отменяем stackFromEnd и переключаемся на скролл к сообщению.
            pendingInitialScrollId = id
            layoutManager.stackFromEnd = false
        } else {
            // onLayout уже прошёл — скроллим немедленно
            recyclerView.post {
                scrollToMessage(id, ChatScrollPosition.CENTER, animated = false, highlight = true)
            }
        }
    }

    fun setCollectionInsets(top: Int, bottom: Int) {
        collectionExtraInsetTop    = context.dpToPx(top.toFloat())
        collectionExtraInsetBottom = context.dpToPx(bottom.toFloat())
        updateRecyclerPadding()
    }

    fun setInputAction(action: ChatInputAction) {
        when (action) {
            is ChatInputAction.Reply -> {
                val msg = messageIndex[action.messageId] ?: return
                inputBar.beginReply(
                    ReplyInfo(
                        replyToId          = msg.id,
                        snapshotSenderName = msg.senderName,
                        snapshotText       = msg.text,
                        snapshotHasImage   = msg.hasImage,
                    ),
                    theme,
                )
            }
            is ChatInputAction.Edit -> {
                val msg  = messageIndex[action.messageId] ?: return
                val text = msg.text ?: return
                inputBar.beginEdit(action.messageId, text, theme)
            }
            is ChatInputAction.None -> inputBar.cancelMode(theme)
        }
    }

    // ─── Commands ─────────────────────────────────────────────────────────

    fun scrollToBottom(animated: Boolean = true) {
        val last = adapter.itemCount - 1
        if (last < 0) return
        if (animated) {
            isProgrammaticScroll = true
            recyclerView.smoothScrollToPosition(last)
            isProgrammaticScroll = false
        } else {
            isProgrammaticScroll = true
            layoutManager.scrollToPositionWithOffset(last, 0)
            isProgrammaticScroll = false
            recyclerView.post {
                recyclerView.post {
                    val lastView = layoutManager.findViewByPosition(last)
                    if (lastView != null) {
                        val extra = lastView.bottom - (recyclerView.height - recyclerView.paddingBottom)
                        if (extra > 0) {
                            isProgrammaticScroll = true
                            recyclerView.scrollBy(0, extra)
                            isProgrammaticScroll = false
                        }
                    }
                }
            }
        }
    }

    /**
     * Скролл к сообщению с гарантированным центрированием в видимой области.
     *
     * Единый CenteringScroller для обоих режимов:
     *   animated=true  → стандартная скорость RecyclerView (calculateTimeForScrolling не
     *                     переопределён), плавная анимация с ease-out интерполятором.
     *   animated=false → calculateTimeForScrolling возвращает 1мс — визуально мгновенно,
     *                     onTargetFound всё равно вызывается для точного выравнивания.
     *
     * Почему не smoothScrollToPosition (для animated=true):
     *   Использует SNAP_TO_ANY — просто делает item видимым, без центрирования.
     *
     * Почему не scrollToPositionWithOffset + post/post:
     *   Pending scroll выполняется в следующем dispatchLayout; findViewByPosition
     *   возвращает null для позиций за пределами viewport — ViewHolder не держится.
     *
     * LinearSmoothScroller.onTargetFound() вызывается RecyclerView именно в тот
     * момент когда target ViewHolder создан и выложен — единственный гарантированный
     * callback с доступом к реальному View для точного вычисления offset.
     */
    fun scrollToMessage(
        id: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.positionOfMessage(id)

        // Захватываем локально до анонимного класса — иначе компилятор видит
        // обращение к членам класса через внешний this и считает их nullable.
        val lm = layoutManager
        val rv = recyclerView

        // CenteringScroller — LinearSmoothScroller который всегда выравнивает
        // target-item по нужной позиции (CENTER / TOP / BOTTOM).
        //
        // animated=true  → стандартная скорость (calculateSpeedPerPixel не переопределён),
        //                   RecyclerView сам анимирует скролл с плавным ускорением/торможением.
        // animated=false → calculateTimeForScrolling возвращает 1мс — визуально мгновенно,
        //                   при этом onTargetFound всё равно вызывается и мы точно выравниваем.
        //
        // Почему не smoothScrollToPosition (для animated=true):
        //   smoothScrollToPosition использует SnapHelper или умолчальный scroller который
        //   просто делает item видимым (SNAP_TO_ANY). Центрирование не гарантируется.
        //
        // Почему не scrollToPositionWithOffset + post:
        //   Pending scroll выполняется в следующем dispatchLayout; findViewByPosition
        //   возвращает null для позиций за пределами viewport — ViewHolder не держится.
        isProgrammaticScroll = true
        val scroller = object : LinearSmoothScroller(context) {

            override fun calculateTimeForScrolling(dx: Int): Int =
                if (animated) super.calculateTimeForScrolling(dx) else 1

            override fun getVerticalSnapPreference() = SNAP_TO_START

            override fun onTargetFound(targetView: View, state: RecyclerView.State, action: Action) {
                val padTop   = rv.paddingTop
                val padBottom = rv.paddingBottom
                val visibleH = rv.height - padTop - padBottom

                val top    = lm.getDecoratedTop(targetView)
                val height = lm.getDecoratedMeasuredHeight(targetView)

                val targetTop = when (position) {
                    ChatScrollPosition.TOP    -> padTop
                    ChatScrollPosition.CENTER -> padTop + (visibleH - height) / 2
                    ChatScrollPosition.BOTTOM -> padTop + visibleH - height
                }

                val dy = top - targetTop
                if (dy != 0) {
                    val duration = if (animated) calculateTimeForDeceleration(abs(dy)) else 1
                    action.update(0, dy, duration, androidx.core.view.animation.PathInterpolatorCompat.create(0.25f, 0.1f, 0.25f, 1f))
                }
            }

            override fun onStop() {
                super.onStop()
                isProgrammaticScroll = false
                revealAfterInitialScroll()
                if (highlight) rv.post { adapter.highlightItem(rv, pos) }
            }
        }
        scroller.targetPosition = pos
        lm.startSmoothScroll(scroller)
    }

    // ─── Strategy application ─────────────────────────────────────────────

    private fun applyStrategy(strategy: UpdateStrategy) {
        sections     = strategy.sections
        messageIndex = strategy.index

        when (strategy) {
            is UpdateStrategy.Prepend -> applyPrepend(strategy)
            is UpdateStrategy.Append  -> applyAppend(strategy)
            is UpdateStrategy.Delete  -> applyDelete(strategy)
            is UpdateStrategy.Update  -> applyUpdate(strategy)
        }
    }

    private fun applyPrepend(s: UpdateStrategy.Prepend) {
        // Якорная компенсация при prepend — фиксируем viewport без прыжков.
        //
        // Почему scrollToPositionWithOffset недостаточен:
        //   Это pending scroll — применяется в dispatchLayout, но RecyclerView
        //   успевает отрисовать один промежуточный кадр со сдвинутым offset → прыжок.
        //
        // Правильный подход — scrollBy сразу после layout:
        //   1. Запоминаем top первого видимого item ДО вставки.
        //   2. submitSections → dispatchUpdatesTo → LLM планирует layout.
        //   3. В OnLayoutChangeListener (срабатывает ровно один раз после layout pass)
        //      вычисляем фактический сдвиг якорного item и компенсируем его scrollBy.
        //      scrollBy применяется мгновенно, без промежуточного кадра.
        //
        // Инерционный скролл: RecyclerView прерывает fling при notify* — это
        // ограничение платформы. Сохраняем velocity и перезапускаем fling после.

        val anchorPos = layoutManager.findFirstVisibleItemPosition().takeIf { it >= 0 }
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorView = layoutManager.findViewByPosition(anchorPos)
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorTopBefore = anchorView.top

        val wasFling  = recyclerView.scrollState == RecyclerView.SCROLL_STATE_SETTLING
        val velocityY = if (wasFling) captureVelocityY() else 0f

        // Один раз после layout — вычисляем точный сдвиг и компенсируем scrollBy
        val newAnchorPos = anchorPos + s.prependedCount
        val layoutListener = object : View.OnLayoutChangeListener {
            override fun onLayoutChange(
                v: View, l: Int, t: Int, r: Int, b: Int,
                ol: Int, ot: Int, or2: Int, ob: Int,
            ) {
                recyclerView.removeOnLayoutChangeListener(this)
                val anchorViewAfter = layoutManager.findViewByPosition(newAnchorPos)
                if (anchorViewAfter != null) {
                    val delta = anchorViewAfter.top - anchorTopBefore
                    if (delta != 0) {
                        isProgrammaticScroll = true
                        recyclerView.scrollBy(0, delta)
                        isProgrammaticScroll = false
                    }
                }
                if (wasFling && velocityY != 0f) {
                    recyclerView.fling(0, velocityY.toInt())
                }
            }
        }
        recyclerView.addOnLayoutChangeListener(layoutListener)

        isProgrammaticScroll = true
        adapter.submitSections(s.sections, s.index)
        isProgrammaticScroll = false
    }

    /** Получает текущую вертикальную скорость скролла через ViewFlinger рефлексией.
     *  Fallback — 0f если рефлексия недоступна. */
    private fun captureVelocityY(): Float = try {
        val flingerField = RecyclerView::class.java.getDeclaredField("mViewFlinger")
            .also { it.isAccessible = true }
        val flinger = flingerField.get(recyclerView) ?: return 0f
        val scrollerField = flinger.javaClass.getDeclaredField("mOverScroller")
            .also { it.isAccessible = true }
        val scroller = scrollerField.get(flinger)
            as? android.widget.OverScroller ?: return 0f
        scroller.currVelocity * if (scroller.finalY > scroller.startY) 1f else -1f
    } catch (_: Exception) { 0f }

    private fun applyAppend(s: UpdateStrategy.Append) {
        adapter.submitSections(s.sections, s.index)
        recyclerView.post { scrollToBottomIfNearBottom() }
    }

    private fun applyDelete(s: UpdateStrategy.Delete) {
        val animDuration = 220L
        val views = s.removedIds.mapNotNull { id ->
            val pos = adapter.positionOfMessage(id)
            recyclerView.findViewHolderForAdapterPosition(pos)?.itemView
        }

        if (views.isEmpty()) {
            // Элементы не видны на экране — просто убираем без анимации
            adapter.submitSections(s.sections, s.index, affectedIds = s.removedIds)
            return
        }

        views.forEach { view ->
            view.animate()
                .alpha(0f)
                .translationX(-view.width * 0.15f)
                .setDuration(animDuration)
                .setInterpolator(android.view.animation.AccelerateInterpolator(1.5f))
                .start()
        }

        recyclerView.postDelayed({
            views.forEach { view ->
                view.alpha        = 1f
                view.translationX = 0f
            }
            adapter.submitSections(s.sections, s.index, affectedIds = s.removedIds)
            recyclerView.scrollBy(0, 0)
        }, animDuration)
    }

    private fun applyUpdate(s: UpdateStrategy.Update) {
        // Передаём changedIds в адаптер — он сбросит alpha и сделает layout pass
        adapter.submitSections(s.sections, s.index, affectedIds = s.changedIds)
    }

    // ─── Initial scroll ───────────────────────────────────────────────────
    //
    // Два случая:
    // 1. Нет initialScrollId → stackFromEnd=true уже выставлен в setMessages,
    //    после layout просто сбрасываем его. Скролл к низу происходит сам.
    // 2. Есть initialScrollId → stackFromEnd сброшен в setInitialScrollId,
    //    откладываем скролл к сообщению до onLayout через pendingInitialScroll.

    private fun performInitialScroll() {
        // Всегда ставим флаг — реальный скролл в onLayout.
        // stackFromEnd уже выставлен если нет initialScrollId,
        // или будет сброшен в setInitialScrollId если он придёт до onLayout.
        pendingInitialScroll = true
    }

    private fun doInitialScroll() {
        val targetId = pendingInitialScrollId
        if (targetId != null) {
            pendingInitialScrollId = null
            scrollToMessage(targetId, ChatScrollPosition.CENTER, animated = false, highlight = true)
            // reveal вызывается из InstantScroller.onStop() после завершения скролла
        } else {
            scrollToBottom(animated = false)
            recyclerView.post { revealAfterInitialScroll() }
        }
    }

    // Плавно проявляем RecyclerView после initial scroll.
    // alpha=0 выставлен в init чтобы скрыть промежуточные позиции при первом layout pass.
    private fun revealAfterInitialScroll() {
        if (recyclerView.alpha == 1f) return
        recyclerView.animate()
            .alpha(1f)
            .setDuration(120)
            .setInterpolator(android.view.animation.DecelerateInterpolator())
            .start()
    }

    // ─── Scroll helpers ───────────────────────────────────────────────────

    private fun isItemVisible(position: Int): Boolean {
        val first = layoutManager.findFirstVisibleItemPosition()
        val last  = layoutManager.findLastVisibleItemPosition()
        return position in first..last
    }

    /**
     * Центрирует уже видимый элемент в области прокрутки.
     * Вычисляет точный offset так чтобы центр элемента совпал с центром RecyclerView.
     */
    private fun centerVisibleItem(position: Int, animated: Boolean) {
        val view = layoutManager.findViewByPosition(position) ?: run {
            layoutManager.scrollToPositionWithOffset(position, recyclerView.height / 2)
            return
        }
        val rvCenter   = recyclerView.height / 2
        val viewCenter = view.top + view.height / 2
        val delta      = viewCenter - rvCenter

        isProgrammaticScroll = true
        if (animated) recyclerView.smoothScrollBy(0, delta)
        else          recyclerView.scrollBy(0, delta)
        isProgrammaticScroll = false
    }

    private fun scrollToBottomIfNearBottom() {
        if (distanceFromBottom() < scrollToBottomThreshold + context.dpToPx(50f)) {
            scrollToBottom(animated = true)
        }
    }

    private fun distanceFromBottom(): Int {
        val range  = recyclerView.computeVerticalScrollRange()
        val offset = recyclerView.computeVerticalScrollOffset()
        val extent = recyclerView.computeVerticalScrollExtent()
        return maxOf(0, range - offset - extent)
    }

    // ─── FAB ──────────────────────────────────────────────────────────────

    private fun updateFabVisibility(animated: Boolean) {
        val show = distanceFromBottom() > scrollToBottomThreshold
        if (show == fabVisible) return
        fabVisible = show

        if (animated) {
            if (show) {
                fabButton.visibility = View.VISIBLE
                fabButton.animate().alpha(1f).scaleX(1f).scaleY(1f)
                    .setDuration(220).setInterpolator(OvershootInterpolator(0.7f)).start()
            } else {
                fabButton.animate().alpha(0f).scaleX(0.7f).scaleY(0.7f)
                    .setDuration(200).withEndAction { fabButton.visibility = View.INVISIBLE }.start()
            }
        } else {
            fabButton.alpha      = if (show) 1f else 0f
            fabButton.visibility = if (show) View.VISIBLE else View.INVISIBLE
        }
    }

    // ─── Empty state ──────────────────────────────────────────────────────

    private fun updateLoadingState() {
        val isEmpty = sections.isEmpty() || sections.all { it.messages.isEmpty() }
        emptyStateView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        if (isEmpty) emptyStateView.setLoading(isLoading)
    }

    // ─── Theme ────────────────────────────────────────────────────────────

    private fun applyThemeToViews() {
        setBackgroundColor(theme.collectionBackground)
        recyclerView.setBackgroundColor(Color.TRANSPARENT)
        inputBar.applyTheme(theme)
        emptyStateView.applyTheme(theme)
        fabButton.applyTheme(theme)
    }

    // ─── Context menu ─────────────────────────────────────────────────────

    private fun showContextMenu(messageId: String, anchor: View) {
        contextMenu?.dismiss()
        contextMenu = ContextMenuView(
            ctx              = context,
            emojis           = emojis,
            actions          = actions,
            isDark           = theme.isDark,
            onEmojiSelected  = { emoji ->
                sendEvent("onEmojiReactionSelect", args {
                    putString("emoji", emoji)
                    putString("messageId", messageId)
                })
            },
            onActionSelected = { action ->
                sendEvent("onActionPress", args {
                    putString("actionId", action.id)
                    putString("messageId", messageId)
                })
            },
            onDismiss = {
                contextMenu = null
            },
        )
        contextMenu?.show(anchor, messageId)
    }

    // ─── Visibility tracking ──────────────────────────────────────────────

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition().takeIf { it >= 0 } ?: return
        val last  = layoutManager.findLastVisibleItemPosition().takeIf { it >= 0 } ?: return
        for (pos in first..last) {
            adapter.messageAt(pos)?.takeIf { !it.isMine }?.let { pendingVisibleIds.add(it.id) }
        }
        removeCallbacks(visibilityRunnable)
        postDelayed(visibilityRunnable, visibilityDebounceMs)
    }

    private fun flushVisibleIds() {
        if (pendingVisibleIds.isEmpty()) return
        val batch = pendingVisibleIds.toList().also { pendingVisibleIds.clear() }
        val arr = Arguments.createArray().also { a -> batch.forEach { a.pushString(it) } }
        sendEvent("onMessagesVisible", args { putArray("messageIds", arr) })
    }

    // ─── Pending highlight ────────────────────────────────────────────────

    private var pendingHighlightPosition: Int? = null

    private fun processPendingHighlight() {
        val pos = pendingHighlightPosition ?: return
        pendingHighlightPosition = null
        recyclerView.post { adapter.highlightItem(recyclerView, pos) }
    }

    // ─── Scroll listener ──────────────────────────────────────────────────

    private val scrollListener = object : RecyclerView.OnScrollListener() {

        private var lastEventMs   = 0L
        private val throttleMs    = 33L
        private var lastLogMs     = 0L
        private val logThrottleMs = 100L  // логи реже чем события — не спамим

        override fun onScrollStateChanged(rv: RecyclerView, newState: Int) {
            val stateName = when (newState) {
                RecyclerView.SCROLL_STATE_IDLE     -> "IDLE"
                RecyclerView.SCROLL_STATE_DRAGGING -> "DRAGGING"
                RecyclerView.SCROLL_STATE_SETTLING -> "SETTLING"
                else                               -> "UNKNOWN($newState)"
            }
            Log.d(TAG, "scrollState → $stateName | waiting=$waitingForNewMessages isLoading=$isLoading")
            when (newState) {
                RecyclerView.SCROLL_STATE_DRAGGING -> isUserDragging = true
                RecyclerView.SCROLL_STATE_IDLE -> {
                    isUserDragging = false
                    processPendingHighlight()
                }
            }
        }

        override fun onScrolled(rv: RecyclerView, dx: Int, dy: Int) {
            updateFabVisibility(animated = true)
            trackVisibleMessages()

            val now = System.currentTimeMillis()

            // Throttled лог каждые 100мс — показывает полное состояние во время скролла
            if (now - lastLogMs >= logThrottleMs) {
                lastLogMs = now
                val offsetY      = rv.computeVerticalScrollOffset()
                val scrollState  = when (rv.scrollState) {
                    RecyclerView.SCROLL_STATE_IDLE     -> "IDLE"
                    RecyclerView.SCROLL_STATE_DRAGGING -> "DRAG"
                    RecyclerView.SCROLL_STATE_SETTLING -> "FLING"
                    else -> "?"
                }
                Log.d(TAG, "onScrolled: dy=$dy offsetY=$offsetY threshold=$topThreshold " +
                    "waiting=$waitingForNewMessages isLoading=$isLoading " +
                    "isProgrammatic=$isProgrammaticScroll state=$scrollState")
            }

            // ── onReachTop — ВСЕГДА до throttle ──────────────────────────────
            // Throttle стоит ниже и срезает sendEvent("onScroll"), но НЕ должен
            // срезать проверку onReachTop. При быстром флинге кадр с
            // distanceFromTop < threshold может попасть в throttle-окно и быть
            // пропущен — тогда список достигает верха без триггера подгрузки.
            if (dy < 0 && !isProgrammaticScroll) {
                val distanceFromTop = rv.computeVerticalScrollOffset()
                if (waitingForNewMessages) {
                    // логируем редко чтобы не спамить
                    if (now - lastLogMs < logThrottleMs) {
                        Log.d(TAG, "onReachTop [SKIP]: dy=$dy distanceFromTop=$distanceFromTop — waitingForNewMessages=true")
                    }
                } else if (distanceFromTop >= topThreshold) {
                    if (now - lastLogMs < logThrottleMs) {
                        Log.d(TAG, "onReachTop [SKIP]: dy=$dy distanceFromTop=$distanceFromTop >= threshold=$topThreshold")
                    }
                } else {
                    waitingForNewMessages = true
                    Log.d(TAG, "onReachTop [scroll]: distanceFromTop=$distanceFromTop threshold=$topThreshold")
                    sendEvent("onReachTop", args { putDouble("distanceFromTop", distanceFromTop.toDouble()) })
                }
            }

            // ── Throttle для onScroll event и visibility tracking ─────────────
            if (now - lastEventMs < throttleMs) return
            lastEventMs = now

            if (isProgrammaticScroll) return

            val offsetY = rv.computeVerticalScrollOffset()
            sendEvent("onScroll", args {
                putDouble("x", 0.0)
                putDouble("y", offsetY.toDouble())
            })
        }
    }

    // ─── InputBarDelegate ─────────────────────────────────────────────────

    private val inputBarDelegate = object : InputBarDelegate {
        override fun onSendText(text: String, replyToId: String?) {
            sendEvent("onSendMessage", args {
                putString("text", text)
                replyToId?.let { putString("replyToId", it) }
            })
        }

        override fun onEditText(text: String, messageId: String) {
            sendEvent("onEditMessage", args {
                putString("text", text)
                putString("messageId", messageId)
            })
        }

        override fun onCancelReply() = sendEvent("onCancelInputAction", args { putString("type", "reply") })
        override fun onCancelEdit()  = sendEvent("onCancelInputAction", args { putString("type", "edit") })
        override fun onAttachmentPress() = sendEvent("onAttachmentPress", Arguments.createMap())

        override fun onHeightChanged(heightPx: Int) {
            updateRecyclerPadding()
            updateFabPosition()
        }
    }

    // ─── Events ───────────────────────────────────────────────────────────

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id.takeIf { it != NO_ID } ?: return
        try {
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId) ?: return
            val surfaceId  = UIManagerHelper.getSurfaceId(this)
            dispatcher.dispatchEvent(RNChatViewEvent(surfaceId, viewId, name, params))
        } catch (_: Exception) { }
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap =
        Arguments.createMap().also { it.block() }
}

// ─── EmptyStateView ───────────────────────────────────────────────────────────

private class EmptyStateView(context: Context) : FrameLayout(context) {

    private val label   = TextView(context)
    private val spinner = android.widget.ProgressBar(context)

    init {
        label.text      = "No messages yet.\nBe the first! 👋"
        label.gravity   = Gravity.CENTER
        label.textSize  = 16f
        addView(label,   LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        addView(spinner, LayoutParams(context.dpToPx(40f), context.dpToPx(40f), Gravity.CENTER))
    }

    /** Вызывается при каждом изменении высоты inputBar / inset-ов.
     *  Сдвигаем контент вверх на половину высоты inputBar чтобы
     *  текст оказался по центру видимой (над inputBar) области. */
    fun setBottomOffset(offsetPx: Int) {
        val lp = label.layoutParams as LayoutParams
        lp.bottomMargin = offsetPx
        label.layoutParams = lp
        val sp = spinner.layoutParams as LayoutParams
        sp.bottomMargin = offsetPx
        spinner.layoutParams = sp
    }

    fun setLoading(loading: Boolean) {
        label.visibility   = if (loading) View.INVISIBLE else View.VISIBLE
        spinner.visibility = if (loading) View.VISIBLE   else View.GONE
    }

    fun applyTheme(theme: ChatTheme) = label.setTextColor(theme.emptyStateText)
}

// ─── FabButton ────────────────────────────────────────────────────────────────

private class FabButton(context: Context) : FrameLayout(context) {

    init {
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
        elevation   = context.dpToPx(C.FAB_ELEVATION_DP).toFloat()
        scaleX      = 0.7f
        scaleY      = 0.7f
        isClickable = true
        isFocusable = true

        addView(TextView(context).apply {
            text     = "↓"
            textSize = 18f
            gravity  = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        })
    }

    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        (getChildAt(0) as? TextView)?.setTextColor(theme.fabArrowColor)
    }
}

// ─── RNChatViewEvent ──────────────────────────────────────────────────────────

private class RNChatViewEvent(
    surfaceId: Int,
    viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap,
) : Event<RNChatViewEvent>(surfaceId, viewId) {
    override fun getEventName(): String      = mEventName
    override fun getEventData(): WritableMap = mEventData
}
