package com.rnapp.chat

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.adapter.ChatAdapter
import com.rnapp.chat.adapter.StickyHeaderDecoration
import com.rnapp.contextmenu.ContextMenuOverlay
import com.rnapp.chat.inputbar.InputBarView
import com.rnapp.chat.model.*
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.theme.ContextMenuTheme
import com.rnapp.chat.utils.DateHelper
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.utils.dpToPx

/**
 * ChatView — главный компонент чата для Android.
 *
 * Публичный API полностью зеркалит NativeChatViewSpec.ts / ChatViewProps:
 *  • messages, actions, emojiReactions, inputAction
 *  • initialScrollId, scrollToBottomThreshold, topThreshold
 *  • isLoading, theme
 *  • все колбэки: onScroll, onReachTop, onMessagesVisible, onMessagePress,
 *    onActionPress, onEmojiReactionSelect, onSendMessage, onEditMessage,
 *    onCancelInputAction, onAttachmentPress, onReplyMessagePress
 *
 * Структура View:
 *  FrameLayout (root)
 *   ├─ RecyclerView          (список сообщений)
 *   ├─ [EmptyState] TextView (заглушка для пустого списка)
 *   ├─ [FAB] FrameLayout     (кнопка "скролл вниз")
 *   └─ InputBarView          (панель ввода, прикреплена снизу)
 */
class ChatView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {

    // ── Public callbacks (зеркало ChatViewProps) ───────────────────────────
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

    // ── Props ─────────────────────────────────────────────────────────────
    var scrollToBottomThreshold: Int = 150.dpToPx(context)
    var topThreshold: Int            = 200.dpToPx(context)
    var isLoading: Boolean           = false
        set(v) { field = v; /* show/hide loading indicator */ }

    var emojiReactions: List<String>  = emptyList()
    var actions: List<ChatAction>     = emptyList()
    var collectionInsetTop: Int       = 0
        set(v) { field = v; recyclerView.setPadding(0, v, 0, recyclerView.paddingBottom) }
    var collectionInsetBottom: Int    = 0
        set(v) { field = v; updateRecyclerBottomPadding() }

    // ── Internal state ────────────────────────────────────────────────────
    private var messages: List<ChatMessage>   = emptyList()
    private var inputAction: ChatInputAction? = null
    private var currentTheme: ChatTheme       = ChatTheme.light
    private var contextMenuTheme: ContextMenuTheme = ContextMenuTheme.light
    private var activeContextMenu: ContextMenuOverlay? = null
    private var pendingContextMessageId: String? = null

    // ── Views ─────────────────────────────────────────────────────────────
    private val recyclerView: RecyclerView
    private val emptyState: TextView
    private val fabButton: FrameLayout
    private val inputBar: InputBarView
    private val sizeCache = ItemSizeCache()

    // ── Adapter & LayoutManager ───────────────────────────────────────────
    private val layoutManager: LinearLayoutManager
    private val adapter: ChatAdapter
    private val stickyDecoration: StickyHeaderDecoration

    // ── Visible messages tracking ─────────────────────────────────────────
    private val visibleMessageIds = mutableSetOf<String>()

    init {
        fun dp(v: Float) = v.dpToPx(context)

        // ── RecyclerView ───────────────────────────────────────────────────
        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false).apply {
            stackFromEnd = true                 // Новые сообщения снизу
        }

        adapter = ChatAdapter(
            theme      = currentTheme,
            sizeCache  = sizeCache,
            callbacks  = object : ChatAdapter.ChatAdapterCallbacks {
                override fun onMessageClick(messageId: String) {
                    onMessagePress?.invoke(messageId)
                }
                override fun onMessageLongClick(messageId: String, holder: RecyclerView.ViewHolder) {
                    showContextMenu(messageId, holder.itemView)
                }
                override fun onReplyClick(messageId: String) {
                    onReplyMessagePress?.invoke(messageId)
                }
            }
        )

        stickyDecoration = StickyHeaderDecoration(adapter, currentTheme)

        recyclerView = RecyclerView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT).apply {
                bottomMargin = 0 // будет обновляться через InputBar
            }
            this.layoutManager = this@ChatView.layoutManager
            this.adapter       = this@ChatView.adapter
            itemAnimator       = null // отключаем анимацию для плавности
            setHasFixedSize(false)
            val topPad = dp(ChatLayoutConstants.COLLECTION_TOP_PADDING_DP)
            val botPad = dp(ChatLayoutConstants.COLLECTION_BOTTOM_PADDING_DP)
            setPadding(0, topPad, 0, botPad)
            clipToPadding = false
            addItemDecoration(stickyDecoration)
        }
        addView(recyclerView)

        // ── Empty state ────────────────────────────────────────────────────
        emptyState = TextView(context).apply {
            text      = "No messages yet.\nBe the first to say hello! 👋"
            textSize  = 15f
            gravity   = Gravity.CENTER
            isVisible = false
            setTextColor(currentTheme.emptyStateText)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        }
        addView(emptyState)

        // ── FAB ────────────────────────────────────────────────────────────
        val fabSize   = dp(ChatLayoutConstants.FAB_SIZE_DP)
        val fabMargin = dp(ChatLayoutConstants.FAB_MARGIN_DP)

        val fabArrow = TextView(context).apply {
            text     = "↓"
            textSize = 18f
            gravity  = Gravity.CENTER
            setTextColor(currentTheme.fabArrowColor)
        }
        fabButton = FrameLayout(context).apply {
            layoutParams = LayoutParams(fabSize, fabSize, Gravity.END or Gravity.BOTTOM).apply {
                bottomMargin = fabMargin
                marginEnd    = fabMargin
            }
            setBackgroundColor(currentTheme.fabBackground)
            elevation  = dp(ChatLayoutConstants.FAB_SHADOW_RADIUS_DP).toFloat()
            isVisible  = false
            addView(fabArrow, FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            setOnClickListener { scrollToBottom() }
        }
        addView(fabButton)

        // ── InputBar ───────────────────────────────────────────────────────
        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, Gravity.BOTTOM)

            onSendClick = { text ->
                val action = inputAction
                when (action?.type) {
                    "edit"  -> onEditMessage?.invoke(text, action.messageId ?: "")
                    else    -> onSendMessage?.invoke(text, action?.messageId?.takeIf { action.type == "reply" })
                }
                setInputAction(null)
            }
            onAttachClick = { onAttachmentPress?.invoke() }
            onCancelAction = {
                val type = inputAction?.type ?: "none"
                setInputAction(null)
                onCancelInputAction?.invoke(type)
            }
            onHeightChanged = { h -> updateRecyclerBottomPadding() }
        }
        addView(inputBar)

        // ── Scroll listener ────────────────────────────────────────────────
        recyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {

            override fun onScrolled(rv: RecyclerView, dx: Int, dy: Int) {
                onScroll?.invoke(dx.toDouble(), dy.toDouble())
                updateFabVisibility()
                checkReachTop()
                trackVisibleMessages()
            }
        })

        // ── Keyboard ───────────────────────────────────────────────────────
        setupKeyboardAwareness()
    }

    // ── Public API (зеркало NativeChatViewSpec) ───────────────────────────

    fun setMessages(newMessages: List<ChatMessage>, initialScrollId: String? = null) {
        messages = newMessages
        val listItems = buildListItems(newMessages)
        adapter.submitList(listItems)
        emptyState.isVisible = newMessages.isEmpty()

        if (initialScrollId != null) {
            scrollToMessage(initialScrollId, animated = false, highlight = false)
        }
    }

    fun setTheme(themeName: String) {
        currentTheme     = if (themeName == "dark") ChatTheme.dark else ChatTheme.light
        contextMenuTheme = if (themeName == "dark") ContextMenuTheme.dark else ContextMenuTheme.light
        adapter.updateTheme(currentTheme)
        stickyDecoration.updateTheme(currentTheme)
        inputBar.applyTheme(currentTheme)
        emptyState.setTextColor(currentTheme.emptyStateText)
        recyclerView.invalidateItemDecorations()
    }

    fun setInputAction(action: ChatInputAction?) {
        inputAction = action
        inputBar.setInputAction(action, messages)
    }

    fun scrollToBottom(animated: Boolean = true) {
        val last = adapter.itemCount - 1
        if (last < 0) return
        if (animated) recyclerView.smoothScrollToPosition(last)
        else          recyclerView.scrollToPosition(last)
    }

    fun scrollToMessage(
        messageId: String,
        position: String   = "center",
        animated: Boolean  = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.findPositionById(messageId)
        if (pos < 0) return

        if (animated) {
            recyclerView.smoothScrollToPosition(pos)
        } else {
            recyclerView.scrollToPosition(pos)
        }

        if (highlight) {
            recyclerView.postDelayed({
                val vh = recyclerView.findViewHolderForAdapterPosition(pos)
                vh?.itemView?.let { animateHighlight(it) }
            }, if (animated) 400L else 50L)
        }
    }

    // ── List building ─────────────────────────────────────────────────────

    private fun buildListItems(msgs: List<ChatMessage>): List<ChatListItem> {
        val result = mutableListOf<ChatListItem>()
        var lastKey = ""
        for (msg in msgs) {
            val key = DateHelper.dateKey(msg.timestamp)
            if (key != lastKey) {
                result.add(ChatListItem.DateHeader(key, DateHelper.sectionTitle(key)))
                lastKey = key
            }
            result.add(ChatListItem.Message(msg))
        }
        return result
    }

    // ── FAB ───────────────────────────────────────────────────────────────

    private fun updateFabVisibility() {
        val offset = recyclerView.computeVerticalScrollOffset()
        val extent = recyclerView.computeVerticalScrollExtent()
        val range  = recyclerView.computeVerticalScrollRange()
        val distFromBottom = range - offset - extent
        val show = distFromBottom > scrollToBottomThreshold
        if (fabButton.isVisible != show) {
            fabButton.isVisible = show
            fabButton.animate().alpha(if (show) 1f else 0f).setDuration(200).start()
        }
    }

    // ── Reach top ─────────────────────────────────────────────────────────

    private fun checkReachTop() {
        val offset = recyclerView.computeVerticalScrollOffset()
        if (offset < topThreshold) {
            onReachTop?.invoke(offset.toDouble())
        }
    }

    // ── Visible messages tracking ─────────────────────────────────────────

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition()
        val last  = layoutManager.findLastVisibleItemPosition()
        if (first < 0 || last < 0) return

        val nowVisible = mutableSetOf<String>()
        for (i in first..last) {
            val item = adapter.getItem(i)
            if (item is ChatListItem.Message) {
                val msg = item.message
                // Только входящие непрочитанные
                if (!msg.isMine && msg.status != "read") {
                    nowVisible.add(msg.id)
                }
            }
        }

        val newIds = nowVisible - visibleMessageIds
        if (newIds.isNotEmpty()) {
            visibleMessageIds.addAll(newIds)
            onMessagesVisible?.invoke(newIds.toList())
        }
    }

    // ── Highlight ─────────────────────────────────────────────────────────

    private fun animateHighlight(view: View) {
        view.animate()
            .alpha(0.4f).setDuration(120)
            .withEndAction { view.animate().alpha(1f).setDuration(200).start() }
            .start()
    }

    // ── Context menu ──────────────────────────────────────────────────────

    private fun showContextMenu(messageId: String, anchorView: View) {
        val activity = context.findActivity() ?: return
        val message  = messages.find { it.id == messageId } ?: return

        // Снимаем скриншот пузыря
        val bitmap = captureBitmap(anchorView)

        val gravity = if (message.isMine)
            ContextMenuOverlay.AnchorGravity.END
        else
            ContextMenuOverlay.AnchorGravity.START

        pendingContextMessageId = messageId

        activeContextMenu = ContextMenuOverlay.create(context, contextMenuTheme).also { menu ->
            menu.show(
                activity      = activity,
                anchorView    = anchorView,
                messageBitmap = bitmap,
                emojis        = emojiReactions,
                actions       = actions,
                anchorGravity = gravity,
                listener      = object : ContextMenuOverlay.Listener {
                    override fun onEmojiSelected(emoji: String) {
                        onEmojiReactionSelect?.invoke(emoji, messageId)
                        activeContextMenu = null
                    }
                    override fun onActionSelected(actionId: String) {
                        onActionPress?.invoke(actionId, messageId)
                        activeContextMenu = null
                    }
                    override fun onDismiss() {
                        activeContextMenu = null
                        pendingContextMessageId = null
                    }
                }
            )
        }
    }

    private fun Context.findActivity(): Activity? {
        var ctx = this
        repeat(10) {
            if (ctx is Activity) return ctx as Activity
            ctx = (ctx as? ContextWrapper)?.baseContext ?: return null
        }
        return null
    }

    private fun captureBitmap(view: View): Bitmap {
        val bmp = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        view.draw(canvas)
        return bmp
    }

    // ── Keyboard awareness ────────────────────────────────────────────────

    private fun setupKeyboardAwareness() {
        // WindowInsetsCompat — рекомендуемый подход для API 21+
        // Обрабатываем IME insets чтобы InputBar поднимался вместе с клавиатурой

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            setWindowInsetsAnimationCallback(object :
                android.view.WindowInsetsAnimation.Callback(DISPATCH_MODE_STOP) {

                override fun onProgress(
                    insets: android.view.WindowInsets,
                    runningAnimations: MutableList<android.view.WindowInsetsAnimation>,
                ): android.view.WindowInsets {
                    val imeBottom = insets.getInsets(android.view.WindowInsets.Type.ime()).bottom
                    val navBottom = insets.getInsets(android.view.WindowInsets.Type.navigationBars()).bottom
                    val keyboardH = maxOf(0, imeBottom - navBottom)

                    // Сдвигаем InputBar вверх на высоту клавиатуры
                    inputBar.translationY = -keyboardH.toFloat()
                    updateRecyclerBottomPadding(keyboardH)
                    return insets
                }
            })
        } else {
            // Fallback для старых версий: ViewTreeObserver
            viewTreeObserver.addOnGlobalLayoutListener {
                val r = android.graphics.Rect()
                getWindowVisibleDisplayFrame(r)
                val screenH   = rootView.height
                val keyboardH = maxOf(0, screenH - r.bottom)
                inputBar.translationY = -keyboardH.toFloat()
                updateRecyclerBottomPadding(keyboardH)
            }
        }
    }

    private fun updateRecyclerBottomPadding(keyboardH: Int = 0) {
        val inputH      = inputBar.height
        val panelH      = 0 // inputBar уже включает панель reply
        val extraBottom = collectionInsetBottom
        val totalPad    = inputH + keyboardH + extraBottom +
                          ChatLayoutConstants.COLLECTION_BOTTOM_PADDING_DP.dpToPx(context)
        recyclerView.setPadding(
            recyclerView.paddingLeft,
            recyclerView.paddingTop,
            recyclerView.paddingRight,
            totalPad
        )
    }
}
