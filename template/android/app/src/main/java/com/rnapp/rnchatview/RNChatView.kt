package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.rnapp.rnchatview.ChatLayoutConstants as C
import kotlin.math.abs

// ─── RNChatView ───────────────────────────────────────────────────────────────
//
// Главный View-оркестратор. Аналог RNChatView.swift + ChatViewController.
//
// Архитектура:
//   • ChatSectionedAdapter  — DiffUtil адаптер с секциями (как DiffableDataSource)
//   • InputBarView          — панель ввода с режимами Normal/Reply/Edit
//   • ContextMenuView       — floating overlay с эмодзи + actions
//   • SectionsBuilder       — группировка по дате
//   • resolveStrategy()     — определение типа обновления (prepend/append/update/delete)

class RNChatView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    // ─── UI Components ────────────────────────────────────────────────────

    private val recyclerView: RecyclerView
    private val adapter: ChatSectionedAdapter
    private val layoutManager: LinearLayoutManager
    private val inputBar: InputBarView
    private val emptyStateView: EmptyStateView
    private val fabButton: FabButton
    private var contextMenu: ContextMenuView? = null

    // ─── State ────────────────────────────────────────────────────────────

    private var sections:       List<MessageSection>      = emptyList()
    private var messageIndex:   Map<String, ChatMessage>  = emptyMap()
    private var actions:        List<MessageAction>       = emptyList()
    private var emojis:         List<String>              = emptyList()
    private var theme:          ChatTheme                 = ChatTheme.light()
    private var isLoading:      Boolean                   = false

    private var topThreshold:              Int     = context.dpToPx(200f)
    private var scrollToBottomThreshold:   Int     = context.dpToPx(150f)
    private var collectionExtraInsetTop:   Int     = 0
    private var collectionExtraInsetBottom: Int    = 0

    private var lastKnownCount:     Int     = 0
    private var waitingForNewMessages: Boolean = false

    // Initial scroll
    private var initialScrollId:    String?  = null
    private var initialScrollDone:  Boolean  = false
    private var pendingScrollId:    String?  = null

    // Scroll state
    private var isProgrammaticScroll: Boolean = false
    private var isUserDragging:       Boolean = false
    private var fabVisible:           Boolean = false

    // Visibility debounce
    private val pendingVisibleIds = mutableSetOf<String>()
    private val visibilityDebounceMs = 300L
    private val visibilityRunnable = Runnable { flushVisibleIds() }

    // Pending highlight
    private var pendingHighlightPosition: Int? = null

    // ─── Init ─────────────────────────────────────────────────────────────

    init {
        // RecyclerView
        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        adapter       = ChatSectionedAdapter(context)
        recyclerView  = RecyclerView(context).apply {
            this.layoutManager = this@RNChatView.layoutManager
            this.adapter       = this@RNChatView.adapter
            setHasFixedSize(false)
            overScrollMode = OVER_SCROLL_NEVER
            itemAnimator   = null   // отключаем стандартную анимацию — DiffUtil сам управляет
            clipToPadding  = false
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }

        // InputBar
        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.gravity = Gravity.BOTTOM
            }
        }

        // EmptyState
        emptyStateView = EmptyStateView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            visibility   = View.GONE
        }

        // FAB
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

        // Обновляем padding RecyclerView когда InputBar меняет высоту
        inputBar.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            val newH = bottom - top
            val oldH = oldBottom - oldTop
            if (newH != oldH) updateRecyclerBottomPadding()
        }

        // Adapter callbacks
        adapter.onMessagePress     = { id -> sendEvent("onMessagePress", Args { putString("messageId", id) }) }
        adapter.onMessageLongPress = { id, anchor -> showContextMenu(id, anchor) }
        adapter.onReplyPress       = { replyId ->
            sendEvent("onReplyMessagePress", Args { putString("messageId", replyId) })
            scrollToMessage(replyId, ChatScrollPosition.CENTER, animated = true, highlight = true)
        }

        // Delegate and scroll listener are assigned after all properties are initialized
        post {
            inputBar.delegate = inputBarDelegate
            recyclerView.addOnScrollListener(scrollListener)
        }
    }

    // ─── Layout ───────────────────────────────────────────────────────────

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        updateRecyclerBottomPadding()
        updateFabPosition()
    }

    private fun updateRecyclerBottomPadding() {
        val inputH    = inputBar.height
        val newBottom = inputH + collectionExtraInsetBottom + context.dpToPx(C.COLLECTION_BOTTOM_PADDING_DP)
        val newTop    = context.dpToPx(C.COLLECTION_TOP_PADDING_DP) + collectionExtraInsetTop

        if (recyclerView.paddingBottom == newBottom && recyclerView.paddingTop == newTop) return
        recyclerView.setPadding(0, newTop, 0, newBottom)
    }

    private fun updateFabPosition() {
        val inputH = inputBar.height
        (fabButton.layoutParams as LayoutParams).bottomMargin =
            inputH + context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
    }

    // ─── Public Props API (called from ViewManager) ────────────────────────

    fun setMessages(newMessages: List<ChatMessage>) {
        val strategy = resolveStrategy(newMessages, messageIndex, sections, lastKnownCount)
        applyStrategy(strategy, newMessages)
        updateLoadingState()
        updateFabVisibility(animated = false)
        if (waitingForNewMessages && newMessages.size > lastKnownCount) waitingForNewMessages = false
        lastKnownCount = newMessages.size

        // Initial scroll (один раз)
        if (!initialScrollDone && newMessages.isNotEmpty()) {
            initialScrollDone = true
            performInitialScroll()
        }
    }

    fun setActions(newActions: List<MessageAction>) {
        actions = newActions
    }

    fun setEmojiReactions(newEmojis: List<String>) {
        emojis = newEmojis
    }

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

    fun setTopThreshold(value: Int) {
        topThreshold = context.dpToPx(value.toFloat())
    }

    fun setScrollToBottomThreshold(value: Int) {
        scrollToBottomThreshold = context.dpToPx(value.toFloat())
    }

    fun setInitialScrollId(id: String?) {
        initialScrollId = id
        if (id != null) pendingScrollId = id
    }

    fun setCollectionInsets(top: Int, bottom: Int) {
        collectionExtraInsetTop    = context.dpToPx(top.toFloat())
        collectionExtraInsetBottom = context.dpToPx(bottom.toFloat())
        updateRecyclerBottomPadding()
    }

    fun setInputAction(action: ChatInputAction) {
        when (action) {
            is ChatInputAction.Reply -> {
                val msg = messageIndex[action.messageId] ?: return
                inputBar.beginReply(
                    ReplyInfo(
                        replyToId  = msg.id,
                        senderName = msg.senderName,
                        text       = msg.text,
                        hasImage   = msg.hasImage,
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

    // ─── Public Commands ──────────────────────────────────────────────────

    fun scrollToBottom(animated: Boolean = true) {
        if (sections.isEmpty()) return
        val totalItems = recyclerView.adapter?.itemCount ?: 0
        if (totalItems == 0) return
        isProgrammaticScroll = true
        if (animated) recyclerView.smoothScrollToPosition(totalItems - 1)
        else          layoutManager.scrollToPositionWithOffset(totalItems - 1, 0)
        isProgrammaticScroll = false
    }

    fun scrollToMessage(
        id: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.positionOfMessage(id)
        if (pos < 0) return

        val scrollOffset = when (position) {
            ChatScrollPosition.TOP    -> 0
            ChatScrollPosition.CENTER -> recyclerView.height / 2
            ChatScrollPosition.BOTTOM -> recyclerView.height
        }

        isProgrammaticScroll = true
        if (animated) {
            recyclerView.smoothScrollToPosition(pos)
            if (highlight) pendingHighlightPosition = pos
        } else {
            layoutManager.scrollToPositionWithOffset(pos, scrollOffset)
            if (highlight) {
                recyclerView.post { adapter.highlightItem(recyclerView, pos) }
            }
        }
        isProgrammaticScroll = false
    }

    // ─── Strategy application ─────────────────────────────────────────────

    private fun applyStrategy(strategy: UpdateStrategy, rawMessages: List<ChatMessage>) {
        when (strategy) {
            is UpdateStrategy.Prepend -> applyPrepend(strategy)
            is UpdateStrategy.Delete  -> applyDelete(strategy)
            is UpdateStrategy.Append  -> applyAppend(strategy)
            is UpdateStrategy.Update  -> applyUpdate(strategy)
        }
    }

    /** Загрузка истории сверху: без анимации + компенсация offset */
    private fun applyPrepend(s: UpdateStrategy.Prepend) {
        val oldRange   = recyclerView.computeVerticalScrollRange()
        val oldOffset  = recyclerView.computeVerticalScrollOffset()

        sections     = s.sections
        messageIndex = s.index
        adapter.submitSections(s.sections, s.index)

        recyclerView.post {
            val newRange = recyclerView.computeVerticalScrollRange()
            val delta    = newRange - oldRange
            if (delta > 0 && !isProgrammaticScroll) {
                isProgrammaticScroll = true
                recyclerView.scrollBy(0, delta)
                isProgrammaticScroll = false
            }
        }
    }

    /** Удаление сообщений с DiffUtil-анимацией */
    private fun applyDelete(s: UpdateStrategy.Delete) {
        sections     = s.sections
        messageIndex = s.index
        adapter.submitSections(s.sections, s.index)
    }

    /** Добавление новых сообщений снизу */
    private fun applyAppend(s: UpdateStrategy.Append) {
        sections     = s.sections
        messageIndex = s.index
        adapter.submitSections(s.sections, s.index)
        // Авто-скролл вниз если пользователь у дна
        recyclerView.post { scrollToBottomIfNearBottom() }
    }

    /** Обновление существующих сообщений */
    private fun applyUpdate(s: UpdateStrategy.Update) {
        sections     = s.sections
        messageIndex = s.index
        adapter.messageIndex = s.index
        adapter.submitSections(s.sections, s.index)
    }

    // ─── Initial scroll ───────────────────────────────────────────────────

    private fun performInitialScroll() {
        recyclerView.post {
            if (pendingScrollId != null) {
                val id = pendingScrollId!!
                pendingScrollId = null
                scrollToMessage(id, ChatScrollPosition.CENTER, animated = false, highlight = true)
            } else {
                scrollToBottom(animated = false)
            }
        }
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
                    .setDuration(220)
                    .setInterpolator(OvershootInterpolator(0.7f))
                    .start()
            } else {
                fabButton.animate().alpha(0f).scaleX(0.7f).scaleY(0.7f)
                    .setDuration(200)
                    .withEndAction { fabButton.visibility = View.INVISIBLE }
                    .start()
            }
        } else {
            fabButton.alpha      = if (show) 1f else 0f
            fabButton.visibility = if (show) View.VISIBLE else View.INVISIBLE
        }
    }

    private fun distanceFromBottom(): Int {
        val range  = recyclerView.computeVerticalScrollRange()
        val offset = recyclerView.computeVerticalScrollOffset()
        val extent = recyclerView.computeVerticalScrollExtent()
        return maxOf(0, range - offset - extent)
    }

    private fun scrollToBottomIfNearBottom() {
        if (distanceFromBottom() < scrollToBottomThreshold + context.dpToPx(50f)) {
            scrollToBottom(animated = true)
        }
    }

    // ─── Empty state & loading ────────────────────────────────────────────

    private fun updateLoadingState() {
        val isEmpty = sections.isEmpty() || sections.all { it.messages.isEmpty() }
        emptyStateView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        if (isEmpty) emptyStateView.setLoading(isLoading)
    }

    // ─── Theme ────────────────────────────────────────────────────────────

    private fun applyThemeToViews() {
        val bg = if (theme.isDark) Color.BLACK else Color.WHITE
        setBackgroundColor(bg)
        inputBar.applyTheme(theme)
        emptyStateView.applyTheme(theme)
        fabButton.applyTheme(theme)
    }

    // ─── Context menu ─────────────────────────────────────────────────────

    private fun showContextMenu(messageId: String, anchor: View) {
        contextMenu?.dismiss()
        contextMenu = ContextMenuView(
            ctx             = context,
            emojis          = emojis,
            actions         = actions,
            isDark          = theme.isDark,
            onEmojiSelected = { emoji ->
                sendEvent("onEmojiReactionSelect", Args {
                    putString("emoji", emoji)
                    putString("messageId", messageId)
                })
            },
            onActionSelected = { action ->
                sendEvent("onActionPress", Args {
                    putString("actionId", action.id)
                    putString("messageId", messageId)
                })
            },
            onDismiss = { contextMenu = null },
        )
        contextMenu?.show(anchor, messageId)
    }

    // ─── Visibility tracking (debounced) ──────────────────────────────────

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition()
        val last  = layoutManager.findLastVisibleItemPosition()
        if (first < 0 || last < 0) return

        for (pos in first..last) {
            val msg = adapter.messageAt(pos) ?: continue
            if (!msg.isMine) pendingVisibleIds.add(msg.id)
        }

        removeCallbacks(visibilityRunnable)
        postDelayed(visibilityRunnable, visibilityDebounceMs)
    }

    private fun flushVisibleIds() {
        if (pendingVisibleIds.isEmpty()) return
        val batch = pendingVisibleIds.toList()
        pendingVisibleIds.clear()
        val arr = Arguments.createArray().also { a -> batch.forEach { a.pushString(it) } }
        sendEvent("onMessagesVisible", Args { putArray("messageIds", arr) })
    }

    // ─── Scroll listener ──────────────────────────────────────────────────

    private val scrollListener = object : RecyclerView.OnScrollListener() {

        private var lastScrollY = 0
        private var lastEventMs = 0L
        private val throttleMs  = 33L   // ~30fps

        override fun onScrollStateChanged(rv: RecyclerView, newState: Int) {
            when (newState) {
                RecyclerView.SCROLL_STATE_DRAGGING -> isUserDragging = true
                RecyclerView.SCROLL_STATE_IDLE     -> {
                    isUserDragging = false
                    processPendingHighlight()
                }
                RecyclerView.SCROLL_STATE_SETTLING -> isUserDragging = false
            }
        }

        override fun onScrolled(rv: RecyclerView, dx: Int, dy: Int) {
            val now = System.currentTimeMillis()
            updateFabVisibility(animated = true)
            trackVisibleMessages()

            if (now - lastEventMs < throttleMs) return
            lastEventMs = now

            if (!isProgrammaticScroll) {
                val offsetY = rv.computeVerticalScrollOffset()
                sendEvent("onScroll", Args {
                    putDouble("x", 0.0)
                    putDouble("y", offsetY.toDouble())
                })

                // Достигли верха → запрос истории
                if (dy < 0) {
                    val topDist = rv.paddingTop - (layoutManager.findViewByPosition(0)?.top ?: Int.MAX_VALUE)
                    if (topDist < topThreshold && !waitingForNewMessages) {
                        waitingForNewMessages = true
                        sendEvent("onReachTop", Args { putDouble("distanceFromTop", topDist.toDouble()) })
                    }
                }
            }

            lastScrollY = rv.computeVerticalScrollOffset()
        }
    }

    // ─── Pending highlight ────────────────────────────────────────────────

    private fun processPendingHighlight() {
        val pos = pendingHighlightPosition ?: return
        pendingHighlightPosition = null
        recyclerView.post { adapter.highlightItem(recyclerView, pos) }
    }

    // ─── InputBarDelegate ─────────────────────────────────────────────────

    private val inputBarDelegate = object : InputBarDelegate {
        override fun onSendText(text: String, replyToId: String?) {
            sendEvent("onSendMessage", Args {
                putString("text", text)
                replyToId?.let { putString("replyToId", it) }
            })
        }

        override fun onEditText(text: String, messageId: String) {
            sendEvent("onEditMessage", Args {
                putString("text", text)
                putString("messageId", messageId)
            })
        }

        override fun onCancelReply() {
            sendEvent("onCancelInputAction", Args { putString("type", "reply") })
        }

        override fun onCancelEdit() {
            sendEvent("onCancelInputAction", Args { putString("type", "edit") })
        }

        override fun onAttachmentPress() {
            sendEvent("onAttachmentPress", Arguments.createMap())
        }

        override fun onHeightChanged(heightPx: Int) {
            updateRecyclerBottomPadding()
            updateFabPosition()
        }
    }

    // ─── Event helper ─────────────────────────────────────────────────────

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id
        if (viewId == NO_ID) return
        reactContext.getJSModule(RCTEventEmitter::class.java)
            ?.receiveEvent(viewId, name, params)
    }

    // ─── Args DSL helper ──────────────────────────────────────────────────

    private fun Args(block: WritableMap.() -> Unit): WritableMap =
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
        val lp = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        addView(label, lp)
        addView(spinner, LayoutParams(context.dpToPx(40f), context.dpToPx(40f), Gravity.CENTER))
    }

    fun setLoading(loading: Boolean) {
        label.visibility   = if (loading) View.INVISIBLE else View.VISIBLE
        spinner.visibility = if (loading) View.VISIBLE   else View.GONE
    }

    fun applyTheme(theme: ChatTheme) {
        label.setTextColor(theme.emptyStateText)
    }
}

// ─── FabButton ────────────────────────────────────────────────────────────────

private class FabButton(context: Context) : FrameLayout(context) {

    private val arrow = TextView(context).apply {
        text     = "↓"
        textSize = 18f
        gravity  = Gravity.CENTER
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    }

    init {
        background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.WHITE)
        }
        elevation   = context.dpToPx(C.FAB_ELEVATION_DP).toFloat()
        scaleX      = 0.7f
        scaleY      = 0.7f
        isClickable = true
        isFocusable = true
        addView(arrow)
    }

    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        arrow.setTextColor(theme.fabArrowColor)
    }
}
