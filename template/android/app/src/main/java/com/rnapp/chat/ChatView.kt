package com.rnapp.chat

import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.adapter.ChatAdapter
import com.rnapp.chat.adapter.StickyHeaderDecoration
import com.rnapp.chat.inputbar.InputBarView
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.model.ChatInputAction
import com.rnapp.chat.model.ChatListItem
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.model.ChatScrollPosition
import com.rnapp.chat.model.MessageStatus
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.theme.ContextMenuTheme
import com.rnapp.chat.utils.DateHelper
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF
import com.rnapp.contextmenu.ContextMenuOverlay

class ChatView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {

    var onScroll: ((x: Double, y: Double) -> Unit)?                          = null
    var onReachTop: ((distanceFromTop: Double) -> Unit)?                     = null
    var onMessagesVisible: ((messageIds: List<String>) -> Unit)?             = null
    var onMessagePress: ((messageId: String) -> Unit)?                       = null
    var onActionPress: ((actionId: String, messageId: String) -> Unit)?      = null
    var onEmojiReactionSelect: ((emoji: String, messageId: String) -> Unit)? = null
    var onSendMessage: ((text: String, replyToId: String?) -> Unit)?         = null
    var onEditMessage: ((text: String, messageId: String) -> Unit)?          = null
    var onCancelInputAction: ((type: String) -> Unit)?                       = null
    var onAttachmentPress: (() -> Unit)?                                     = null
    var onReplyMessagePress: ((messageId: String) -> Unit)?                  = null

    var scrollToBottomThreshold: Int = 150.dpToPx(context)
        set(v) { field = v; if (::recyclerView.isInitialized) post { updateFabVisibility(animated = false) } }

    var topThreshold: Int = 200.dpToPx(context)

    var isLoading: Boolean = false
        set(v) { field = v; if (::emptyStateContainer.isInitialized) updateEmptyState() }

    var actions: List<ChatAction> = emptyList()
    var emojiReactions: List<String> = emptyList()

    var collectionInsetTop: Int = 0
        set(v) {
            field = v
            if (::recyclerView.isInitialized) {
                recyclerView.setPadding(recyclerView.paddingLeft, v + defaultTopPadding,
                    recyclerView.paddingRight, recyclerView.paddingBottom)
            }
        }

    var collectionInsetBottom: Int = 0
        set(v) { field = v; if (::recyclerView.isInitialized) updateRecyclerBottomPadding() }

    private var messages: List<ChatMessage> = emptyList()
    private var messageIndex: Map<String, ChatMessage> = emptyMap()
    private var currentInputAction: ChatInputAction? = null
    private var currentTheme: ChatTheme = ChatTheme.light
    private var contextMenuTheme: ContextMenuTheme = ContextMenuTheme.light

    private var pendingInitialScrollId: String? = null
    private var initialScrollDone: Boolean = false

    // FIX #7: флаг для различения типов обновлений — нужен ли auto-scroll
    private var pendingScrollToBottom: Boolean = false

    private var lastScrollEventTime: Long = 0L
    private val scrollThrottleMs: Long = 33L
    private val mainHandler = Handler(Looper.getMainLooper())
    private var visibilityDebounceRunnable: Runnable? = null
    private val visibilityDebounceMs: Long = 300L
    private val seenMessageIds = mutableSetOf<String>()
    private val pendingVisibleIds = mutableSetOf<String>()
    private var fabVisible: Boolean = false
    private var currentKeyboardHeight: Int = 0
    private var defaultTopPadding: Int = 0
    private var defaultBottomPadding: Int = 0

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateContainer: FrameLayout
    private lateinit var emptyStateLabel: TextView
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var fabButton: ImageView
    private lateinit var inputBar: InputBarView
    private lateinit var replyPanel: com.rnapp.chat.inputbar.ReplyPanelView
    private lateinit var layoutManager: LinearLayoutManager
    private lateinit var adapter: ChatAdapter
    private lateinit var stickyDecoration: StickyHeaderDecoration
    private val sizeCache = ItemSizeCache()

    // ─── AdapterDataObserver ──────────────────────────────────────────────────
    /**
     * FIX #7: Вызывается RecyclerView ПОСЛЕ применения diff — данные и размеры актуальны.
     * Обрабатываем ВСЕ типы изменений (вставка, удаление, изменение).
     * При удалении сообщения — onItemRangeRemoved срабатывает немедленно после
     * dispatchUpdatesTo(), RecyclerView уже анимирует удаление.
     */
    private val adapterObserver = object : RecyclerView.AdapterDataObserver() {
        override fun onItemRangeInserted(positionStart: Int, itemCount: Int) {
            handleDataChanged(scrollIfNearBottom = true)
        }
        override fun onItemRangeRemoved(positionStart: Int, itemCount: Int) {
            // FIX #7: при удалении не нужен auto-scroll, но обновляем FAB и visibility
            handleDataChanged(scrollIfNearBottom = false)
        }
        override fun onItemRangeChanged(positionStart: Int, itemCount: Int) {
            handleDataChanged(scrollIfNearBottom = false)
        }
        override fun onItemRangeChanged(positionStart: Int, itemCount: Int, payload: Any?) {
            handleDataChanged(scrollIfNearBottom = false)
        }
        override fun onChanged() {
            handleDataChanged(scrollIfNearBottom = pendingScrollToBottom)
        }

        private fun handleDataChanged(scrollIfNearBottom: Boolean) {
            if (scrollIfNearBottom && pendingScrollToBottom) {
                pendingScrollToBottom = false
                post { scrollToBottomIfNearBottom() }
            } else {
                pendingScrollToBottom = false
            }
            post { updateFabVisibility(animated = false) }
        }
    }

    private val scrollListener = object : RecyclerView.OnScrollListener() {
        override fun onScrolled(rv: RecyclerView, dx: Int, dy: Int) {
            val now = System.currentTimeMillis()
            if (now - lastScrollEventTime >= scrollThrottleMs) {
                lastScrollEventTime = now
                onScroll?.invoke(0.0, rv.computeVerticalScrollOffset().toDouble())
            }
            if (rv.computeVerticalScrollOffset() < topThreshold) {
                onReachTop?.invoke(rv.computeVerticalScrollOffset().toDouble())
            }
            updateFabVisibility(animated = true)
            trackVisibleMessages()
        }

        override fun onScrollStateChanged(rv: RecyclerView, newState: Int) {
            if (newState == RecyclerView.SCROLL_STATE_IDLE) {
                trackVisibleMessages()
                flushPendingVisibleIds()
            }
        }
    }

    init {
        defaultTopPadding    = ChatLayoutConstants.COLLECTION_TOP_PADDING_DP.dpToPx(context)
        defaultBottomPadding = ChatLayoutConstants.COLLECTION_BOTTOM_PADDING_DP.dpToPx(context)
        setupAdapter()
        setupRecyclerView()
        setupEmptyState()
        setupFab()
        setupInputBar()
        setupReplyPanel()
        setupKeyboardAwareness()
    }

    private fun setupAdapter() {
        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false).apply {
            stackFromEnd = true
        }
        adapter = ChatAdapter(
            theme     = currentTheme,
            sizeCache = sizeCache,
            callbacks = object : ChatAdapter.ChatAdapterCallbacks {
                override fun onMessageClick(messageId: String) { onMessagePress?.invoke(messageId) }
                override fun onMessageLongClick(messageId: String, anchorView: View) { showContextMenu(messageId, anchorView) }
                override fun onReplyClick(messageId: String) {
                    // FIX #4: скроллим к центру с анимацией
                    scrollToMessage(messageId, ChatScrollPosition.CENTER, animated = true, highlight = true)
                    onReplyMessagePress?.invoke(messageId)
                }
            }
        )
        stickyDecoration = StickyHeaderDecoration(adapter, currentTheme)
        adapter.registerAdapterDataObserver(adapterObserver)
    }

    private fun setupRecyclerView() {
        recyclerView = RecyclerView(context).apply {
            layoutParams  = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            layoutManager = this@ChatView.layoutManager
            adapter       = this@ChatView.adapter
            itemAnimator  = null
            setHasFixedSize(false)
            setPadding(0, defaultTopPadding, 0, defaultBottomPadding)
            clipToPadding = false
            addItemDecoration(stickyDecoration)
            addOnScrollListener(scrollListener)
        }
        addView(recyclerView)
    }

    private fun setupEmptyState() {
        emptyStateLabel = TextView(context).apply {
            text     = "No messages yet.\nBe the first to say hello! 👋"
            textSize = 15f
            gravity  = Gravity.CENTER
            setTextColor(currentTheme.emptyStateText)
        }
        loadingSpinner = ProgressBar(context).apply { isVisible = false }
        emptyStateContainer = FrameLayout(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            isVisible = false
            addView(emptyStateLabel, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
            addView(loadingSpinner,  FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        }
        addView(emptyStateContainer)
    }

    private fun setupFab() {
        val fabSizePx   = ChatLayoutConstants.FAB_SIZE_DP.dpToPx(context)
        val fabMarginPx = ChatLayoutConstants.FAB_MARGIN_DP.dpToPx(context)
        val pad         = fabSizePx / 4
        fabButton = ImageView(context).apply {
            setImageResource(android.R.drawable.arrow_down_float)
            setColorFilter(currentTheme.fabArrowColor)
            elevation  = ChatLayoutConstants.FAB_SHADOW_RADIUS_DP.dpToPxF(context)
            scaleType  = ImageView.ScaleType.CENTER_INSIDE
            setPadding(pad, pad, pad, pad)
            isVisible  = false
            alpha      = 0f
            layoutParams = LayoutParams(fabSizePx, fabSizePx, Gravity.END or Gravity.BOTTOM).apply {
                marginEnd    = fabMarginPx
                bottomMargin = fabMarginPx
            }
            setOnClickListener { scrollToBottom(animated = true) }
        }
        refreshFabBackground(currentTheme)
        addView(fabButton)
    }

    private fun refreshFabBackground(theme: ChatTheme) {
        fabButton.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(theme.fabBackground)
        }
        fabButton.clipToOutline = true
        fabButton.outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
    }

    private fun setupInputBar() {
        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, Gravity.BOTTOM)
            onSendClick = { text ->
                val action = currentInputAction
                when (action?.type) {
                    "edit"  -> { onEditMessage?.invoke(text, action.messageId ?: ""); setInputAction(null) }
                    "reply" -> { onSendMessage?.invoke(text, action.messageId);       setInputAction(null) }
                    else    ->   onSendMessage?.invoke(text, null)
                }
            }
            onAttachClick = { onAttachmentPress?.invoke() }
        }
        addView(inputBar)
    }

    private fun setupReplyPanel() {
        replyPanel = com.rnapp.chat.inputbar.ReplyPanelView(context).apply {
            // bottomMargin будет выставляться динамически = inputBar.height
            // Gravity.BOTTOM + bottomMargin = inputBar.height → панель строго над инпутом
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 0, Gravity.BOTTOM)
            onCancelAction = {
                val type = currentInputAction?.type ?: "reply"
                setInputAction(null)
                onCancelInputAction?.invoke(type)
            }
            onHeightChanged = { panelH ->
                // Двигаем inputBar вверх на высоту панели (+ клавиатура уже в translationY)
                inputBar.translationY = -(currentKeyboardHeight + panelH).toFloat()
                fabButton.translationY = inputBar.translationY
                // Обновляем padding RecyclerView синхронно
                updateRecyclerBottomPadding()
            }
        }
        addView(replyPanel)

        // После того как inputBar измерен — выставляем bottomMargin панели
        inputBar.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            val lp = replyPanel.layoutParams as? LayoutParams ?: return@addOnLayoutChangeListener
            val newMargin = inputBar.height
            if (lp.bottomMargin != newMargin) {
                lp.bottomMargin = newMargin
                replyPanel.layoutParams = lp
            }
        }
    }

    private fun setupKeyboardAwareness() {
        ViewCompat.setWindowInsetsAnimationCallback(this,
            object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {
                override fun onProgress(insets: WindowInsetsCompat, runningAnimations: MutableList<WindowInsetsAnimationCompat>): WindowInsetsCompat {
                    val imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
                    val navBottom = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
                    currentKeyboardHeight = maxOf(0, imeBottom - navBottom)
                    applyKeyboardOffset(currentKeyboardHeight)
                    return insets
                }
                override fun onEnd(animation: WindowInsetsAnimationCompat) {
                    val wi = ViewCompat.getRootWindowInsets(this@ChatView) ?: return
                    val imeBottom = wi.getInsets(WindowInsetsCompat.Type.ime()).bottom
                    val navBottom = wi.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
                    currentKeyboardHeight = maxOf(0, imeBottom - navBottom)
                    applyKeyboardOffset(currentKeyboardHeight)
                }
            })
    }

    private fun applyKeyboardOffset(keyboardHeight: Int) {
        val panelH = if (::replyPanel.isInitialized) replyPanel.currentHeight() else 0
        val ty = -(keyboardHeight + panelH).toFloat()
        inputBar.translationY  = ty
        fabButton.translationY = ty
        updateRecyclerBottomPadding(keyboardHeight)
    }

    private fun updateRecyclerBottomPadding(keyboardHeight: Int = currentKeyboardHeight) {
        val inputH = if (::inputBar.isInitialized && inputBar.height > 0) inputBar.height else 0
        val panelH = if (::replyPanel.isInitialized) replyPanel.currentHeight() else 0
        val totalPad = inputH + panelH + keyboardHeight + collectionInsetBottom + defaultBottomPadding
        if (recyclerView.paddingBottom == totalPad) return
        recyclerView.setPadding(recyclerView.paddingLeft, recyclerView.paddingTop, recyclerView.paddingRight, totalPad)
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * FIX #7: Оптимизированное обновление списка.
     *
     * Ключевые улучшения:
     * 1. DiffUtil работает на снапшотах — O(N) диф без блокировки UI.
     * 2. При удалении сообщения DiffUtil генерирует REMOVE анимацию — RecyclerView
     *    немедленно убирает item без необходимости скролла.
     * 3. Убраны ручные ветки hasDeletions/hasAdditions — DiffUtil сам определяет
     *    минимальный набор операций.
     * 4. isPrepend() оставлен для коррекции позиции скролла при подгрузке истории.
     * 5. messageIndex обновляется атомарно вместе с items в submitList().
     */
    fun setMessages(newMessages: List<ChatMessage>) {
        val newIndex = newMessages.associateBy { it.id }
        val newItems = buildListItems(newMessages)

        val wasAtBottom = distanceFromBottom() <= scrollToBottomThreshold + 50
        val isAppend    = newMessages.size > messages.size &&
                          messages.isNotEmpty() &&
                          !isPrepend(newMessages)

        // При добавлении нового сообщения и пользователь у дна — автоскролл вниз
        pendingScrollToBottom = isAppend && wasAtBottom

        if (newMessages.isNotEmpty() && messages.isNotEmpty() && isPrepend(newMessages)) {
            // Подгрузка старых сообщений сверху — сохраняем позицию скролла
            applyPrepend(newMessages, newItems, newIndex)
        } else {
            // FIX #7: единый путь для всех остальных изменений (включая удаление).
            // DiffUtil вычислит минимальный набор операций (remove/insert/change).
            // RecyclerView анимирует удаление немедленно — элемент исчезает без скролла.
            messages     = newMessages
            messageIndex = newIndex
            adapter.submitList(newItems, newIndex)
        }

        updateEmptyState()

        // Актуализируем текст в панели reply/edit при обновлении messages
        if (::replyPanel.isInitialized) {
            replyPanel.refreshIfNeeded(currentInputAction, newMessages)
        }

        if (!initialScrollDone && newMessages.isNotEmpty()) {
            initialScrollDone = true
            performInitialScroll()
        }
    }

    fun setTheme(themeName: String) {
        val newTheme    = if (themeName.equals("dark", ignoreCase = true)) ChatTheme.dark else ChatTheme.light
        val newCtxTheme = if (newTheme.isDark) ContextMenuTheme.dark else ContextMenuTheme.light
        if (newTheme == currentTheme) return
        currentTheme = newTheme; contextMenuTheme = newCtxTheme
        applyTheme()
    }

    /**
     * FIX #5: setInputAction теперь правильно передаёт messages в InputBarView.
     * inputBar.setInputAction() обновляет панель над полем ввода (reply/edit panel).
     * Это также срабатывает при изменении inputAction пропса из JS.
     */
    fun setInputAction(action: ChatInputAction?) {
        val prevAction = currentInputAction
        currentInputAction = action
        if (prevAction?.type == "edit" && action?.type != "edit") {
            inputBar.editText.setText("")
        }
        if (action?.type == "edit") {
            val msg = messages.find { it.id == action.messageId }
            if (inputBar.editText.text.isNullOrBlank()) {
                inputBar.editText.setText(msg?.text ?: "")
                inputBar.editText.setSelection(inputBar.editText.text.length)
            }
        }
        replyPanel.setInputAction(action, messages)
        if (action != null) post { scrollToBottomIfNearBottom() }
    }

    fun setPendingInitialScrollId(id: String?) { pendingInitialScrollId = id }

    fun scrollToBottom(animated: Boolean) {
        if (adapter.itemCount == 0) return
        val lastPos = adapter.itemCount - 1
        if (animated) recyclerView.smoothScrollToPosition(lastPos)
        else          layoutManager.scrollToPositionWithOffset(lastPos, 0)
    }

    /**
     * FIX #4: Скролл к сообщению с позиционированием по центру видимой области.
     *
     * Проблема: smoothScrollToPosition() просто делал элемент видимым,
     * но не центрировал его. При центрировании нужно знать высоту элемента.
     *
     * Решение:
     *  • Для animated=true: используем двухшаговый подход:
     *    1. smoothScrollToPosition(pos) — делает элемент видимым
     *    2. После окончания скролла — точное позиционирование через scrollToPositionWithOffset
     *       Это зеркало iOS: layoutIfNeeded() + scrollToItem(.centeredVertically)
     *
     *  • Для animated=false: прямой scrollToPositionWithOffset с вычисленным offset.
     *    Если view уже на экране — используем реальную высоту.
     *    Если нет — используем sizeCache или fallback расчёт.
     */
    fun scrollToMessage(
        messageId: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.findPositionById(messageId)
        if (pos < 0) return

        if (animated) {
            // Двухшаговый центрированный скролл с анимацией
            recyclerView.smoothScrollToPosition(pos)

            // После завершения анимации — уточняем позицию до центра
            val checkRunnable = object : Runnable {
                private var attempts = 0
                override fun run() {
                    attempts++
                    val view = layoutManager.findViewByPosition(pos)
                    if (view != null) {
                        // Элемент виден — точно центрируем
                        if (position == ChatScrollPosition.CENTER) {
                            val offset = (recyclerView.height - view.height) / 2
                            layoutManager.scrollToPositionWithOffset(pos, offset)
                        }
                        if (highlight) highlightMessage(messageId)
                    } else if (attempts < 10) {
                        // Ещё не видим — повторим через кадр
                        mainHandler.postDelayed(this, 50L)
                    }
                }
            }
            mainHandler.postDelayed(checkRunnable, 350L)
        } else {
            // Мгновенный скролл с точным центрированием
            val existingView = layoutManager.findViewByPosition(pos)
            val itemH = existingView?.height
                ?: sizeCache.get(messageId).takeIf { it > 0 }
                ?: estimateItemHeight()

            val offset = when (position) {
                ChatScrollPosition.TOP    -> 0
                ChatScrollPosition.BOTTOM -> recyclerView.height - itemH
                ChatScrollPosition.CENTER -> (recyclerView.height - itemH) / 2
            }
            layoutManager.scrollToPositionWithOffset(pos, maxOf(0, offset))
            if (highlight) post { highlightMessage(messageId) }
        }
    }

    /** Примерная высота элемента для центрирования когда view не на экране */
    private fun estimateItemHeight(): Int =
        ChatLayoutConstants.MINIMUM_CELL_HEIGHT_DP.dpToPx(context) * 3

    private fun performInitialScroll() {
        post {
            val targetId = pendingInitialScrollId
            if (targetId != null) {
                pendingInitialScrollId = null
                scrollToMessage(targetId, ChatScrollPosition.CENTER, animated = false, highlight = true)
            } else {
                scrollToBottom(animated = false)
            }
        }
    }

    private fun buildListItems(msgs: List<ChatMessage>): List<ChatListItem> {
        val result  = mutableListOf<ChatListItem>()
        var lastKey = ""
        for (msg in msgs) {
            val key = DateHelper.dateKey(msg.timestamp)
            if (key != lastKey) {
                result.add(ChatListItem.DateHeader(key, DateHelper.sectionTitle(context, key)))
                lastKey = key
            }
            result.add(ChatListItem.Message(msg))
        }
        return result
    }

    private fun isPrepend(newMessages: List<ChatMessage>): Boolean {
        if (messages.isEmpty() || newMessages.isEmpty()) return false
        return newMessages.first().timestamp <= messages.first().timestamp &&
               newMessages.last().id == messages.last().id
    }

    private fun applyPrepend(
        newMessages: List<ChatMessage>,
        newItems: List<ChatListItem>,
        newIndex: Map<String, ChatMessage>,
    ) {
        val oldRange = recyclerView.computeVerticalScrollRange()
        messages = newMessages; messageIndex = newIndex
        adapter.submitList(newItems, newIndex)
        post {
            val delta = recyclerView.computeVerticalScrollRange() - oldRange
            if (delta > 0) recyclerView.scrollBy(0, delta)
        }
    }

    private fun updateEmptyState() {
        val isEmpty = messages.isEmpty()
        emptyStateContainer.isVisible = isEmpty
        if (isEmpty) {
            emptyStateLabel.isVisible = !isLoading
            loadingSpinner.isVisible  = isLoading
        }
    }

    private fun updateFabVisibility(animated: Boolean) {
        val show = distanceFromBottom() > scrollToBottomThreshold
        if (show == fabVisible) return
        fabVisible = show
        if (animated) {
            if (show) fabButton.isVisible = true
            fabButton.animate()
                .alpha(if (show) 1f else 0f)
                .scaleX(if (show) 1f else 0.7f).scaleY(if (show) 1f else 0.7f)
                .setDuration(200L)
                .withEndAction { if (!show) fabButton.isVisible = false }
                .start()
        } else {
            fabButton.isVisible = show
            fabButton.alpha  = if (show) 1f else 0f
            fabButton.scaleX = if (show) 1f else 0.7f
            fabButton.scaleY = if (show) 1f else 0.7f
        }
    }

    private fun distanceFromBottom(): Int {
        val offset = recyclerView.computeVerticalScrollOffset()
        val extent = recyclerView.computeVerticalScrollExtent()
        val range  = recyclerView.computeVerticalScrollRange()
        return maxOf(0, range - offset - extent)
    }

    private fun scrollToBottomIfNearBottom() {
        if (distanceFromBottom() < scrollToBottomThreshold + 50) scrollToBottom(animated = true)
    }

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition()
        val last  = layoutManager.findLastVisibleItemPosition()
        if (first < 0 || last < 0) return
        var hasNew = false
        for (i in first..last) {
            if (i >= adapter.itemCount) break
            val item = adapter.getItem(i)
            if (item is ChatListItem.Message) {
                val msg = item.message
                if (!msg.isMine && msg.status != MessageStatus.READ && msg.id !in seenMessageIds) {
                    pendingVisibleIds.add(msg.id); hasNew = true
                }
            }
        }
        if (hasNew) scheduleDebouncedVisibilityFlush()
    }

    private fun scheduleDebouncedVisibilityFlush() {
        visibilityDebounceRunnable?.let { mainHandler.removeCallbacks(it) }
        val r = Runnable { flushPendingVisibleIds() }
        visibilityDebounceRunnable = r
        mainHandler.postDelayed(r, visibilityDebounceMs)
    }

    private fun flushPendingVisibleIds() {
        if (pendingVisibleIds.isEmpty()) return
        val ids = pendingVisibleIds.toList()
        seenMessageIds.addAll(ids); pendingVisibleIds.clear()
        onMessagesVisible?.invoke(ids)
    }

    private fun highlightMessage(messageId: String) {
        val pos = adapter.findPositionById(messageId)
        if (pos < 0) return
        val vh = recyclerView.findViewHolderForAdapterPosition(pos) ?: return
        vh.itemView.animate().alpha(0.4f).setDuration(120L)
            .withEndAction { vh.itemView.animate().alpha(1f).setDuration(200L).start() }.start()
    }

    private fun applyTheme() {
        adapter.updateTheme(currentTheme)
        stickyDecoration.updateTheme(currentTheme)
        emptyStateLabel.setTextColor(currentTheme.emptyStateText)
        fabButton.setColorFilter(currentTheme.fabArrowColor)
        refreshFabBackground(currentTheme)
        inputBar.applyTheme(currentTheme)
        if (::replyPanel.isInitialized) replyPanel.applyTheme(currentTheme)
        recyclerView.invalidateItemDecorations()
    }

    private fun showContextMenu(messageId: String, anchorView: View) {
        val activity = findActivity() ?: return
        val message  = messageIndex[messageId] ?: return
        val w = maxOf(1, anchorView.width); val h = maxOf(1, anchorView.height)
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        anchorView.draw(Canvas(bmp))
        val gravity = if (message.isMine) ContextMenuOverlay.AnchorGravity.END else ContextMenuOverlay.AnchorGravity.START
        // FIX #2: ContextMenuOverlay использует WindowManager — поверх InputBar
        ContextMenuOverlay.create(context, contextMenuTheme).show(
            activity = activity, anchorView = anchorView, messageBitmap = bmp,
            emojis = emojiReactions, actions = actions, anchorGravity = gravity,
            listener = object : ContextMenuOverlay.Listener {
                override fun onEmojiSelected(emoji: String)     { onEmojiReactionSelect?.invoke(emoji, messageId) }
                override fun onActionSelected(actionId: String) { onActionPress?.invoke(actionId, messageId) }
                override fun onDismiss() {}
            }
        )
    }

    private fun findActivity(): android.app.Activity? {
        var ctx = context
        repeat(10) {
            if (ctx is android.app.Activity) return ctx as android.app.Activity
            ctx = (ctx as? ContextWrapper)?.baseContext ?: return null
        }
        return null
    }
}
