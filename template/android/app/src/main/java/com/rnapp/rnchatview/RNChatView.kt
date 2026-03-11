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
        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        adapter       = ChatSectionedAdapter(context)

        recyclerView = RecyclerView(context).apply {
            this.layoutManager = this@RNChatView.layoutManager
            this.adapter       = this@RNChatView.adapter
            setHasFixedSize(false)
            overScrollMode = OVER_SCROLL_NEVER
            // itemAnimator = null — убираем стандартные анимации вставки/удаления.
            // Следствие: после DiffUtil нужен scrollBy(0,0) для принудительного layout pass.
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
        Log.d(TAG, "setMessages: ${newMessages.size} messages | initialScrollDone=$initialScrollDone | pendingInitialScrollId=$pendingInitialScrollId")

        // Для первой загрузки без initialScrollId — stackFromEnd=true ДО applyStrategy.
        // Это заставляет LinearLayoutManager разложить items снизу с первого layout pass.
        // Работало ранее. Если придёт initialScrollId — сбросим stackFromEnd в setInitialScrollId.
        if (!initialScrollDone && newMessages.isNotEmpty() && pendingInitialScrollId == null) {
            layoutManager.stackFromEnd = true
        }

        val strategy = resolveStrategy(newMessages, messageIndex, sections, lastKnownCount)
        applyStrategy(strategy)
        updateLoadingState()
        updateFabVisibility(animated = false)

        if (waitingForNewMessages && newMessages.size > lastKnownCount) {
            waitingForNewMessages = false
        }
        lastKnownCount = newMessages.size

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
        isLoading = loading
        if (!loading) waitingForNewMessages = false
        updateLoadingState()
    }

    fun setTopThreshold(value: Int) { topThreshold = context.dpToPx(value.toFloat()) }

    fun setScrollToBottomThreshold(value: Int) { scrollToBottomThreshold = context.dpToPx(value.toFloat()) }

    fun setInitialScrollId(id: String?) {
        Log.d(TAG, "setInitialScrollId: id=$id | initialScrollDone=$initialScrollDone | pendingInitialScroll=$pendingInitialScroll")
        if (id == null) return

        if (!initialScrollDone) {
            // setMessages ещё не было — просто сохраняем
            pendingInitialScrollId = id
        } else if (pendingInitialScroll) {
            // setMessages было, onLayout ещё нет (именно этот случай из логов).
            // Отменяем stackFromEnd и переключаемся на скролл к сообщению.
            pendingInitialScrollId = id
            layoutManager.stackFromEnd = false
            Log.d(TAG, "setInitialScrollId: cancelled stackFromEnd, will scroll to $id in onLayout")
        } else {
            // onLayout уже прошёл — скроллим немедленно
            Log.d(TAG, "setInitialScrollId: arrived after onLayout, scrolling now")
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
        Log.d(TAG, "scrollToBottom: last=$last animated=$animated rvHeight=${recyclerView.height}")
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
                    Log.d(TAG, "scrollToBottom post2: lastView=$lastView bottom=${lastView?.bottom} rvH=${recyclerView.height} padBottom=${recyclerView.paddingBottom}")
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
        if (pos < 0) { Log.w(TAG, "scrollToMessage: id=$id not found"); return }
        Log.d(TAG, "scrollToMessage: id=$id pos=$pos animated=$animated rvHeight=${recyclerView.height}")

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
                Log.d(TAG, "scrollToMessage onTargetFound: pos=$pos top=$top targetTop=$targetTop dy=$dy animated=$animated")
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
                Log.d(TAG, "scrollToMessage onStop: pos=$pos")
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
        val oldRange  = recyclerView.computeVerticalScrollRange()
        val oldOffset = recyclerView.computeVerticalScrollOffset()

        adapter.submitSections(s.sections, s.index)

        recyclerView.post {
            val delta = recyclerView.computeVerticalScrollRange() - oldRange
            if (delta > 0 && !isProgrammaticScroll) {
                isProgrammaticScroll = true
                recyclerView.scrollBy(0, delta)
                isProgrammaticScroll = false
            }
        }
    }

    private fun applyAppend(s: UpdateStrategy.Append) {
        adapter.submitSections(s.sections, s.index)
        recyclerView.post { scrollToBottomIfNearBottom() }
    }

    private fun applyDelete(s: UpdateStrategy.Delete) {
        Log.d(TAG, "applyDelete: removing ${s.removedIds}")
        adapter.submitSections(s.sections, s.index, affectedIds = s.removedIds)
    }

    private fun applyUpdate(s: UpdateStrategy.Update) {
        Log.d(TAG, "applyUpdate: changed ${s.changedIds}")
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
        Log.d(TAG, "doInitialScroll: targetId=$targetId adapterCount=${adapter.itemCount} rvHeight=${recyclerView.height}")
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
        setBackgroundColor(if (theme.isDark) Color.BLACK else Color.WHITE)
        inputBar.applyTheme(theme)
        emptyStateView.applyTheme(theme)
        fabButton.applyTheme(theme)
    }

    // ─── Context menu ─────────────────────────────────────────────────────

    private fun showContextMenu(messageId: String, anchor: View) {
        Log.d(TAG, "showContextMenu: $messageId")
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

        private var lastEventMs = 0L
        private val throttleMs  = 33L

        override fun onScrollStateChanged(rv: RecyclerView, newState: Int) {
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
            if (now - lastEventMs < throttleMs) return
            lastEventMs = now

            if (isProgrammaticScroll) return

            val offsetY = rv.computeVerticalScrollOffset()
            sendEvent("onScroll", args {
                putDouble("x", 0.0)
                putDouble("y", offsetY.toDouble())
            })

            if (dy < 0) {
                val firstView = layoutManager.findViewByPosition(0)
                val topDist   = rv.paddingTop - (firstView?.top ?: Int.MAX_VALUE)
                if (topDist < topThreshold && !waitingForNewMessages) {
                    waitingForNewMessages = true
                    sendEvent("onReachTop", args { putDouble("distanceFromTop", topDist.toDouble()) })
                }
            }
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
            UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId)
                ?.dispatchEvent(RNChatViewEvent(viewId, name, params))
        } catch (e: Exception) {
            Log.e(TAG, "sendEvent $name failed", e)
        }
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap =
        Arguments.createMap().also { it.block() }
}

// ─── EmptyStateView ───────────────────────────────────────────────────────────

private class EmptyStateView(context: Context) : FrameLayout(context) {

    private val label   = TextView(context)
    private val spinner = android.widget.ProgressBar(context)

    init {
        label.text    = "No messages yet.\nBe the first! 👋"
        label.gravity = Gravity.CENTER
        label.textSize = 16f
        addView(label, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        addView(spinner, LayoutParams(context.dpToPx(40f), context.dpToPx(40f), Gravity.CENTER))
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
    viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap,
) : Event<RNChatViewEvent>(viewId) {
    override fun getEventName(): String  = mEventName
    override fun getEventData(): WritableMap = mEventData
}
