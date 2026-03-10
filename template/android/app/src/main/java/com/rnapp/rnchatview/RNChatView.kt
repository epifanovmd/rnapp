package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.Log
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
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

private const val TAG = "RNChatView"

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
        Log.d(TAG, "RNChatView initialized")

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

        // Добавляем observer для отслеживания изменений в адаптере
        adapter.registerAdapterDataObserver(object : RecyclerView.AdapterDataObserver() {
            override fun onItemRangeRemoved(positionStart: Int, itemCount: Int) {
                Log.d(TAG, "Adapter observer: items removed at position $positionStart, count: $itemCount")
                super.onItemRangeRemoved(positionStart, itemCount)
            }

            override fun onItemRangeInserted(positionStart: Int, itemCount: Int) {
                Log.d(TAG, "Adapter observer: items inserted at position $positionStart, count: $itemCount")
                super.onItemRangeInserted(positionStart, itemCount)
            }

            override fun onItemRangeChanged(positionStart: Int, itemCount: Int) {
                Log.d(TAG, "Adapter observer: items changed at position $positionStart, count: $itemCount")
                super.onItemRangeChanged(positionStart, itemCount)
            }

            override fun onChanged() {
                Log.d(TAG, "Adapter observer: entire dataset changed")
                super.onChanged()
            }
        })

        // InputBar
        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.gravity = Gravity.BOTTOM
            }
            // delegate assigned after all class properties are initialized (see post{} below)
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
        adapter.onMessagePress     = { id ->
            Log.d(TAG, "Message pressed: $id")
            sendEvent("onMessagePress", Args { putString("messageId", id) })
        }
        adapter.onMessageLongPress = { id, anchor, _ ->
            Log.d(TAG, "Message long pressed: $id")
            showContextMenu(id, anchor)
        }
        adapter.onReplyPress       = { replyId ->
            Log.d(TAG, "Reply pressed: $replyId")
            sendEvent("onReplyMessagePress", Args { putString("messageId", replyId) })
            scrollToMessage(replyId, ChatScrollPosition.CENTER, animated = true, highlight = true)
        }

        // Defer delegate + scrollListener assignment until after class init completes
        // (inputBarDelegate and scrollListener are declared as val after this init block)
        post {
            inputBar.delegate = inputBarDelegate
            recyclerView.addOnScrollListener(scrollListener)
            Log.d(TAG, "Post init completed: delegate and scroll listener attached")
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
        Log.d(TAG, "Updating recycler padding: top=$newTop, bottom=$newBottom")
        recyclerView.setPadding(0, newTop, 0, newBottom)
    }

    private fun updateFabPosition() {
        val inputH = inputBar.height
        if (inputH == 0) return
        val lp = fabButton.layoutParams as? LayoutParams ?: return
        val newMargin = inputH + context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
        if (lp.bottomMargin == newMargin) return
        lp.bottomMargin = newMargin
        fabButton.layoutParams = lp  // reassign triggers requestLayout
    }

    // ─── Public Props API (called from ViewManager) ────────────────────────

    fun setMessages(newMessages: List<ChatMessage>) {
        Log.d(TAG, "setMessages called with ${newMessages.size} messages. Current count: $lastKnownCount")

        // Логируем ID сообщений для отладки
        val newIds = newMessages.joinToString { it.id }
        val oldIds = messageIndex.keys.joinToString()
        Log.d(TAG, "New message IDs: [$newIds]")
        Log.d(TAG, "Old message IDs: [$oldIds]")

        // Проверяем какие ID были удалены
        val deletedIds = messageIndex.keys.filter { id -> newMessages.none { it.id == id } }
        if (deletedIds.isNotEmpty()) {
            Log.d(TAG, "Detected deleted messages: $deletedIds")
        }

        val strategy = resolveStrategy(newMessages, messageIndex, sections, lastKnownCount)
        Log.d(TAG, "Resolved strategy: ${strategy.javaClass.simpleName}")

        applyStrategy(strategy, newMessages)
        updateLoadingState()
        updateFabVisibility(animated = false)

        if (waitingForNewMessages && newMessages.size > lastKnownCount) {
            Log.d(TAG, "Waiting for new messages resolved")
            waitingForNewMessages = false
        }

        lastKnownCount = newMessages.size

        // Initial scroll (один раз)
        if (!initialScrollDone && newMessages.isNotEmpty()) {
            Log.d(TAG, "Performing initial scroll")
            initialScrollDone = true
            performInitialScroll()
        }
    }

    fun setActions(newActions: List<MessageAction>) {
        Log.d(TAG, "setActions called with ${newActions.size} actions")
        actions = newActions
    }

    fun setEmojiReactions(newEmojis: List<String>) {
        Log.d(TAG, "setEmojiReactions called with ${newEmojis.size} emojis")
        emojis = newEmojis
    }

    fun setTheme(name: String) {
        Log.d(TAG, "setTheme called: $name")
        theme = ChatTheme.from(name)
        adapter.theme = theme
        applyThemeToViews()
    }

    fun setIsLoading(loading: Boolean) {
        Log.d(TAG, "setIsLoading called: $loading")
        isLoading = loading
        if (!loading) waitingForNewMessages = false
        updateLoadingState()
    }

    fun setTopThreshold(value: Int) {
        topThreshold = context.dpToPx(value.toFloat())
        Log.d(TAG, "setTopThreshold: $value dp -> ${topThreshold}px")
    }

    fun setScrollToBottomThreshold(value: Int) {
        scrollToBottomThreshold = context.dpToPx(value.toFloat())
        Log.d(TAG, "setScrollToBottomThreshold: $value dp -> ${scrollToBottomThreshold}px")
    }

    fun setInitialScrollId(id: String?) {
        Log.d(TAG, "setInitialScrollId: $id")
        initialScrollId = id
        if (id != null) pendingScrollId = id
    }

    fun setCollectionInsets(top: Int, bottom: Int) {
        collectionExtraInsetTop    = context.dpToPx(top.toFloat())
        collectionExtraInsetBottom = context.dpToPx(bottom.toFloat())
        Log.d(TAG, "setCollectionInsets: top=$top dp -> ${collectionExtraInsetTop}px, bottom=$bottom dp -> ${collectionExtraInsetBottom}px")
        updateRecyclerBottomPadding()
    }

    fun setInputAction(action: ChatInputAction) {
        Log.d(TAG, "setInputAction: ${action.javaClass.simpleName}")
        when (action) {
            is ChatInputAction.Reply -> {
                val msg = messageIndex[action.messageId] ?: return
                Log.d(TAG, "Starting reply for message: ${msg.id}")
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
                Log.d(TAG, "Starting edit for message: ${msg.id}")
                inputBar.beginEdit(action.messageId, text, theme)
            }
            is ChatInputAction.None -> {
                Log.d(TAG, "Cancelling input mode")
                inputBar.cancelMode(theme)
            }
        }
    }

    // ─── Public Commands ──────────────────────────────────────────────────

    fun scrollToBottom(animated: Boolean = true) {
        Log.d(TAG, "scrollToBottom called, animated=$animated")
        if (sections.isEmpty()) {
            Log.d(TAG, "scrollToBottom: sections empty, returning")
            return
        }
        val totalItems = recyclerView.adapter?.itemCount ?: 0
        if (totalItems == 0) {
            Log.d(TAG, "scrollToBottom: no items, returning")
            return
        }
        Log.d(TAG, "scrollToBottom: total items=$totalItems")
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
        Log.d(TAG, "scrollToMessage called: id=$id, position=$position, animated=$animated, highlight=$highlight")
        val pos = adapter.positionOfMessage(id)
        if (pos < 0) {
            Log.d(TAG, "scrollToMessage: message not found")
            return
        }
        Log.d(TAG, "scrollToMessage: found at position $pos")

        val scrollOffset = when (position) {
            ChatScrollPosition.TOP    -> 0
            ChatScrollPosition.CENTER -> recyclerView.height / 2
            ChatScrollPosition.BOTTOM -> recyclerView.height
        }

        isProgrammaticScroll = true
        if (animated) {
            recyclerView.smoothScrollToPosition(pos)
            if (highlight) {
                Log.d(TAG, "scrollToMessage: setting pending highlight for position $pos")
                pendingHighlightPosition = pos
            }
        } else {
            layoutManager.scrollToPositionWithOffset(pos, scrollOffset)
            if (highlight) {
                Log.d(TAG, "scrollToMessage: highlighting immediately at $pos")
                recyclerView.post { adapter.highlightItem(recyclerView, pos) }
            }
        }
        isProgrammaticScroll = false
    }

    // ─── Strategy application ─────────────────────────────────────────────

    private fun applyStrategy(strategy: UpdateStrategy, rawMessages: List<ChatMessage>) {
        Log.d(TAG, "applyStrategy: ${strategy.javaClass.simpleName}")

        // Логируем количество секций до и после
        val oldSectionsCount = sections.size
        val oldMessagesCount = sections.sumOf { it.messages.size }

        when (strategy) {
            is UpdateStrategy.Prepend -> applyPrepend(strategy)
            is UpdateStrategy.Delete  -> applyDelete(strategy)
            is UpdateStrategy.Append  -> applyAppend(strategy)
            is UpdateStrategy.Update  -> applyUpdate(strategy)
        }

        val newMessagesCount = sections.sumOf { it.messages.size }
        Log.d(TAG, "applyStrategy completed: old count=$oldMessagesCount, new count=$newMessagesCount, sections: $oldSectionsCount -> ${sections.size}")
    }

    /** Загрузка истории сверху: без анимации + компенсация offset */
    private fun applyPrepend(s: UpdateStrategy.Prepend) {
        Log.d(TAG, "applyPrepend: adding ${s.sections.sumOf { it.messages.size }} messages at top")
        val oldRange   = recyclerView.computeVerticalScrollRange()
        val oldOffset  = recyclerView.computeVerticalScrollOffset()
        Log.d(TAG, "applyPrepend: old scroll range=$oldRange, offset=$oldOffset")

        sections     = s.sections
        messageIndex = s.index
        adapter.submitSections(s.sections, s.index)

        recyclerView.post {
            val newRange = recyclerView.computeVerticalScrollRange()
            val delta    = newRange - oldRange
            Log.d(TAG, "applyPrepend post: new range=$newRange, delta=$delta")
            if (delta > 0 && !isProgrammaticScroll) {
                isProgrammaticScroll = true
                recyclerView.scrollBy(0, delta)
                Log.d(TAG, "applyPrepend: scrolled by $delta")
                isProgrammaticScroll = false
            }
        }
    }

    /** Удаление сообщений с DiffUtil-анимацией */
    private fun applyDelete(s: UpdateStrategy.Delete) {
        val oldMessageCount = sections.sumOf { it.messages.size }
        val newMessageCount = s.sections.sumOf { it.messages.size }
        val deletedCount = oldMessageCount - newMessageCount

        Log.d(TAG, "applyDelete: removing $deletedCount messages (from $oldMessageCount to $newMessageCount)")

        // Находим удаленные сообщения для логирования
        val oldIds = sections.flatMap { it.messages.map { msg -> msg.id } }
        val newIds = s.sections.flatMap { it.messages.map { msg -> msg.id } }
        val deletedIds = oldIds.filter { id -> !newIds.contains(id) }
        Log.d(TAG, "applyDelete: deleted message IDs: $deletedIds")

        sections     = s.sections
        messageIndex = s.index

        // Сбрасываем alpha на ViewHolder-ах удаляемых сообщений.
        // ContextMenuView скрывает anchor-view (alpha=0f) пока меню открыто.
        // Если сообщение удаляется пока меню анимирует закрытие, ViewHolder может
        // остаться с alpha=0f и быть переиспользован с неверным значением.
        s.removedIds.forEach { id ->
            val pos = adapter.positionOfMessage(id)
            if (pos >= 0) {
                recyclerView.findViewHolderForAdapterPosition(pos)?.itemView?.alpha = 1f
            }
        }

        val currentItemCount = adapter.itemCount
        Log.d(TAG, "applyDelete: adapter current item count before submit: $currentItemCount")

        adapter.submitSections(s.sections, s.index)

        // scrollBy(0,0) заставляет LayoutManager немедленно выполнить layout pass
        // и физически убрать удалённые ViewHolder-ы с экрана (при itemAnimator=null
        // RecyclerView не всегда делает это самостоятельно в том же кадре).
        recyclerView.post {
            recyclerView.scrollBy(0, 0)
            Log.d(TAG, "applyDelete post: adapter item count after submit: ${adapter.itemCount}")
        }
    }

    /** Добавление новых сообщений снизу */
    private fun applyAppend(s: UpdateStrategy.Append) {
        val addedCount = s.sections.sumOf { it.messages.size } - sections.sumOf { it.messages.size }
        Log.d(TAG, "applyAppend: adding $addedCount messages at bottom")

        sections     = s.sections
        messageIndex = s.index
        adapter.submitSections(s.sections, s.index)

        // Авто-скролл вниз если пользователь у дна
        recyclerView.post {
            Log.d(TAG, "applyAppend post: checking if should scroll to bottom")
            scrollToBottomIfNearBottom()
        }
    }

    /** Обновление существующих сообщений */
    private fun applyUpdate(s: UpdateStrategy.Update) {
        Log.d(TAG, "applyUpdate: updating messages")
        sections     = s.sections
        messageIndex = s.index
        adapter.messageIndex = s.index

        // Сбрасываем alpha на изменяемых ViewHolder-ах — аналогично applyDelete:
        // ContextMenuView мог выставить alpha=0f на anchor пока меню было открыто.
        s.changedIds.forEach { id ->
            val pos = adapter.positionOfMessage(id)
            if (pos >= 0) {
                recyclerView.findViewHolderForAdapterPosition(pos)?.itemView?.alpha = 1f
            }
        }

        adapter.submitSections(s.sections, s.index)

        // Принудительный layout pass — без него изменения могут не отобразиться
        // до следующего скролла (та же проблема что и в applyDelete).
        recyclerView.post { recyclerView.scrollBy(0, 0) }
    }

    // ─── Initial scroll ───────────────────────────────────────────────────

    private fun performInitialScroll() {
        recyclerView.post {
            if (pendingScrollId != null) {
                val id = pendingScrollId!!
                Log.d(TAG, "performInitialScroll: to message $id")
                pendingScrollId = null
                scrollToMessage(id, ChatScrollPosition.CENTER, animated = false, highlight = true)
            } else {
                Log.d(TAG, "performInitialScroll: to bottom")
                scrollToBottom(animated = false)
            }
        }
    }

    // ─── FAB ──────────────────────────────────────────────────────────────

    private fun updateFabVisibility(animated: Boolean) {
        val distance = distanceFromBottom()
        val show = distance > scrollToBottomThreshold
        if (show == fabVisible) return

        Log.d(TAG, "updateFabVisibility: show=$show, distance=$distance, threshold=$scrollToBottomThreshold")
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
        val distance = maxOf(0, range - offset - extent)
        return distance
    }

    private fun scrollToBottomIfNearBottom() {
        val distance = distanceFromBottom()
        Log.d(TAG, "scrollToBottomIfNearBottom: distance=$distance, threshold=${scrollToBottomThreshold + context.dpToPx(50f)}")
        if (distance < scrollToBottomThreshold + context.dpToPx(50f)) {
            Log.d(TAG, "scrollToBottomIfNearBottom: scrolling to bottom")
            scrollToBottom(animated = true)
        }
    }

    // ─── Empty state & loading ────────────────────────────────────────────

    private fun updateLoadingState() {
        val isEmpty = sections.isEmpty() || sections.all { it.messages.isEmpty() }
        Log.d(TAG, "updateLoadingState: isEmpty=$isEmpty, isLoading=$isLoading")
        emptyStateView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        if (isEmpty) emptyStateView.setLoading(isLoading)
    }

    // ─── Theme ────────────────────────────────────────────────────────────

    private fun applyThemeToViews() {
        val bg = if (theme.isDark) Color.BLACK else Color.WHITE
        Log.d(TAG, "applyThemeToViews: isDark=${theme.isDark}")
        setBackgroundColor(bg)
        inputBar.applyTheme(theme)
        emptyStateView.applyTheme(theme)
        fabButton.applyTheme(theme)
    }

    // ─── Context menu ─────────────────────────────────────────────────────

    private fun showContextMenu(messageId: String, anchor: View) {
        Log.d(TAG, "showContextMenu for message: $messageId")
        contextMenu?.dismiss()
        contextMenu = ContextMenuView(
            ctx             = context,
            emojis          = emojis,
            actions         = actions,
            isDark          = theme.isDark,
            onEmojiSelected = { emoji ->
                Log.d(TAG, "Context menu emoji selected: $emoji for message $messageId")
                sendEvent("onEmojiReactionSelect", Args {
                    putString("emoji", emoji)
                    putString("messageId", messageId)
                })
            },
            onActionSelected = { action ->
                Log.d(TAG, "Context menu action selected: ${action.id} for message $messageId")
                sendEvent("onActionPress", Args {
                    putString("actionId", action.id)
                    putString("messageId", messageId)
                })
            },
            onDismiss = {
                Log.d(TAG, "Context menu dismissed")
                contextMenu = null
            },
        )
        contextMenu?.show(anchor, messageId)
    }

    // ─── Visibility tracking (debounced) ──────────────────────────────────

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition()
        val last  = layoutManager.findLastVisibleItemPosition()
        if (first < 0 || last < 0) return

        val visibleIds = mutableListOf<String>()
        for (pos in first..last) {
            val msg = adapter.messageAt(pos) ?: continue
            if (!msg.isMine) {
                pendingVisibleIds.add(msg.id)
                visibleIds.add(msg.id)
            }
        }

        if (visibleIds.isNotEmpty()) {
            Log.d(TAG, "trackVisibleMessages: visible messages added to pending: $visibleIds")
        }

        removeCallbacks(visibilityRunnable)
        postDelayed(visibilityRunnable, visibilityDebounceMs)
    }

    private fun flushVisibleIds() {
        if (pendingVisibleIds.isEmpty()) return
        val batch = pendingVisibleIds.toList()
        Log.d(TAG, "flushVisibleIds: sending ${batch.size} visible messages: $batch")
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
            val stateStr = when (newState) {
                RecyclerView.SCROLL_STATE_DRAGGING -> "DRAGGING"
                RecyclerView.SCROLL_STATE_IDLE -> "IDLE"
                RecyclerView.SCROLL_STATE_SETTLING -> "SETTLING"
                else -> "UNKNOWN"
            }
            Log.d(TAG, "onScrollStateChanged: $stateStr")

            when (newState) {
                RecyclerView.SCROLL_STATE_DRAGGING -> {
                    isUserDragging = true
                }
                RecyclerView.SCROLL_STATE_IDLE     -> {
                    isUserDragging = false
                    processPendingHighlight()

                    // При остановке скролла проверяем актуальность отображения
                    val firstVisible = layoutManager.findFirstVisibleItemPosition()
                    val lastVisible = layoutManager.findLastVisibleItemPosition()
                    Log.d(TAG, "Scroll idle: visible items $firstVisible - $lastVisible of ${adapter.itemCount}")
                }
                RecyclerView.SCROLL_STATE_SETTLING -> { /* inertial fling — keep isUserDragging=true to prevent padding jitter */ }
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
                    val firstView = layoutManager.findViewByPosition(0)
                    val topDist = rv.paddingTop - (firstView?.top ?: Int.MAX_VALUE)
                    Log.d(TAG, "onScrolled: scrolling up, topDist=$topDist, threshold=$topThreshold")

                    if (topDist < topThreshold && !waitingForNewMessages) {
                        Log.d(TAG, "onScrolled: reached top, requesting more messages")
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
        Log.d(TAG, "processPendingHighlight: highlighting position $pos")
        pendingHighlightPosition = null
        recyclerView.post { adapter.highlightItem(recyclerView, pos) }
    }

    // ─── InputBarDelegate ─────────────────────────────────────────────────

    private val inputBarDelegate = object : InputBarDelegate {
        override fun onSendText(text: String, replyToId: String?) {
            Log.d(TAG, "InputBarDelegate: onSendText, text='$text', replyToId=$replyToId")
            sendEvent("onSendMessage", Args {
                putString("text", text)
                replyToId?.let { putString("replyToId", it) }
            })
        }

        override fun onEditText(text: String, messageId: String) {
            Log.d(TAG, "InputBarDelegate: onEditText, text='$text', messageId=$messageId")
            sendEvent("onEditMessage", Args {
                putString("text", text)
                putString("messageId", messageId)
            })
        }

        override fun onCancelReply() {
            Log.d(TAG, "InputBarDelegate: onCancelReply")
            sendEvent("onCancelInputAction", Args { putString("type", "reply") })
        }

        override fun onCancelEdit() {
            Log.d(TAG, "InputBarDelegate: onCancelEdit")
            sendEvent("onCancelInputAction", Args { putString("type", "edit") })
        }

        override fun onAttachmentPress() {
            Log.d(TAG, "InputBarDelegate: onAttachmentPress")
            sendEvent("onAttachmentPress", Arguments.createMap())
        }

        override fun onHeightChanged(heightPx: Int) {
            Log.d(TAG, "InputBarDelegate: onHeightChanged, height=$heightPx")
            updateRecyclerBottomPadding()
            updateFabPosition()
        }
    }

    // ─── Event helper ─────────────────────────────────────────────────────

private fun sendEvent(name: String, params: WritableMap) {
    val viewId = id
    if (viewId == NO_ID) {
        Log.w(TAG, "sendEvent: viewId is NO_ID, skipping event $name")
        return
    }

    Log.d(TAG, "sendEvent: $name with params: $params")

    try {
        val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId)
        if (dispatcher != null) {
            // Используем конструктор с параметрами
            val event = RNChatViewEvent(viewId, name, params)
            dispatcher.dispatchEvent(event)
        } else {
            Log.w(TAG, "sendEvent: dispatcher is null for event $name")
        }
    } catch (e: Exception) {
        Log.e(TAG, "Failed to send event $name", e)
    }
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
        Log.d(TAG, "EmptyStateView created")
    }

    fun setLoading(loading: Boolean) {
        Log.d(TAG, "EmptyStateView.setLoading: $loading")
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
        Log.d(TAG, "FabButton created")
    }

    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        arrow.setTextColor(theme.fabArrowColor)
    }
}

private class RNChatViewEvent(
    viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap
) : com.facebook.react.uimanager.events.Event<RNChatViewEvent>(viewId) {

    override fun getEventName(): String = mEventName

    override fun getEventData(): WritableMap = mEventData
}
