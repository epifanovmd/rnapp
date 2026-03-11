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

    // Initial scroll — выполняется ровно один раз после первых данных
    private var initialScrollId:   String?  = null
    private var initialScrollDone: Boolean  = false
    private var pendingScrollId:   String?  = null

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
        adapter.onMessageLongPress = { id, anchor, _ -> showContextMenu(id, anchor) }
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
        Log.d(TAG, "setMessages: ${newMessages.size} messages (was $lastKnownCount)")

        val strategy = resolveStrategy(newMessages, messageIndex, sections, lastKnownCount)
        Log.d(TAG, "strategy: ${strategy::class.simpleName}")

        applyStrategy(strategy)
        updateLoadingState()
        updateFabVisibility(animated = false)

        if (waitingForNewMessages && newMessages.size > lastKnownCount) {
            waitingForNewMessages = false
        }
        lastKnownCount = newMessages.size

        // Первый scroll — ровно один раз
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
        initialScrollId = id
        if (id != null) pendingScrollId = id
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
        val totalItems = adapter.itemCount.takeIf { it > 0 } ?: return
        isProgrammaticScroll = true
        if (animated) recyclerView.smoothScrollToPosition(totalItems - 1)
        else          layoutManager.scrollToPositionWithOffset(totalItems - 1, 0)
        isProgrammaticScroll = false
    }

    /**
     * Скролл к сообщению с подсветкой.
     * Если сообщение уже видимо — всё равно центрируем и подсвечиваем.
     */
    fun scrollToMessage(
        id: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.positionOfMessage(id)
        if (pos < 0) { Log.w(TAG, "scrollToMessage: id=$id not found"); return }

        val isVisible = isItemVisible(pos)

        when {
            !isVisible && animated -> {
                // Сначала скроллим, подсвечиваем после остановки
                isProgrammaticScroll = true
                recyclerView.smoothScrollToPosition(pos)
                isProgrammaticScroll = false
                if (highlight) pendingHighlightPosition = pos
            }
            !isVisible -> {
                val offset = when (position) {
                    ChatScrollPosition.TOP    -> 0
                    ChatScrollPosition.CENTER -> recyclerView.height / 2
                    ChatScrollPosition.BOTTOM -> recyclerView.height
                }
                isProgrammaticScroll = true
                layoutManager.scrollToPositionWithOffset(pos, offset)
                isProgrammaticScroll = false
                if (highlight) recyclerView.post { adapter.highlightItem(recyclerView, pos) }
            }
            else -> {
                // Уже видимо — центрируем без анимации и подсвечиваем
                centerVisibleItem(pos, animated)
                if (highlight) recyclerView.post { adapter.highlightItem(recyclerView, pos) }
            }
        }
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

    private fun performInitialScroll() {
        recyclerView.post {
            if (pendingScrollId != null) {
                val id = pendingScrollId!!
                pendingScrollId = null
                scrollToMessage(id, ChatScrollPosition.CENTER, animated = false, highlight = true)
            } else {
                // По умолчанию — показываем последнее сообщение
                scrollToBottom(animated = false)
            }
        }
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
