package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.animation.PathInterpolatorCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.LinearSmoothScroller
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.rnapp.rncontextmenu.ContextMenuAction
import com.rnapp.rncontextmenu.ContextMenuView
import com.rnapp.rnchatview.ChatLayoutConstants as C
import kotlin.math.abs

private const val TAG = "RNChatView"

class RNChatView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    private val recyclerView: RecyclerView
    private val adapter: ChatAdapter
    private val layoutManager: LinearLayoutManager
    private val inputBar: InputBarView
    private val emptyStateView: EmptyStateView
    private val fabButton: FabButton
    private var contextMenu: ContextMenuView? = null

    private var sections: List<MessageSection> = emptyList()
    private var messageIndex: Map<String, ChatMessage> = emptyMap()
    private var actions: List<MessageAction> = emptyList()
    private var emojis: List<String> = emptyList()
    private var theme: ChatTheme = ChatTheme.light()
    private var isLoading: Boolean = false

    private var keyboardHeightPx: Int = 0
    private var kbHeightAtAnimStart: Int = 0
    private var isKeyboardAnimating: Boolean = false

    private var topThreshold: Int = context.dpToPx(200f)
    private var scrollToBottomThreshold: Int = context.dpToPx(150f)
    private var collectionExtraInsetTop: Int = 0
    private var collectionExtraInsetBottom: Int = 0

    private var lastKnownCount: Int = 0
    private var waitingForNewMessages: Boolean = false
    private var pendingInitialScrollId: String? = null
    private var initialScrollDone: Boolean = false
    private var pendingInitialScroll: Boolean = false
    private var isProgrammaticScroll: Boolean = false
    private var isUserDragging: Boolean = false
    private var fabVisible: Boolean = false
    private var lastKnownInputBarHeight: Int = 0

    private val pendingVisibleIds = mutableSetOf<String>()
    private val visibilityDebounceMs = 300L
    private val visibilityRunnable = Runnable { flushVisibleIds() }

    init {
        clipChildren = false
        clipToPadding = false

        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        adapter = ChatAdapter(context)

        recyclerView = RecyclerView(context).apply {
            this.layoutManager = this@RNChatView.layoutManager
            this.adapter = this@RNChatView.adapter
            setHasFixedSize(false)
            overScrollMode = OVER_SCROLL_NEVER
            itemAnimator = null
            clipToPadding = false
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 0)
            alpha = 0f
        }

        inputBar = InputBarView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).also {
                it.gravity = Gravity.BOTTOM
            }
        }

        emptyStateView = EmptyStateView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            visibility = View.GONE
        }

        fabButton = FabButton(context).apply {
            layoutParams = LayoutParams(
                context.dpToPx(C.FAB_SIZE_DP),
                context.dpToPx(C.FAB_SIZE_DP)
            ).also {
                it.gravity = Gravity.END or Gravity.BOTTOM
                it.marginEnd = context.dpToPx(C.FAB_MARGIN_END_DP)
                it.bottomMargin = context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
            }
            alpha = 0f
            visibility = View.INVISIBLE
            setOnClickListener { scrollToBottom(animated = true) }
        }

        addView(recyclerView)
        addView(inputBar)
        addView(emptyStateView)
        addView(fabButton)

        inputBar.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            if (bottom - top != oldBottom - oldTop) syncLayout()
        }

        setupKeyboardAnimation()
        setupAdapterCallbacks()

        post {
            inputBar.delegate = inputBarDelegate
            recyclerView.addOnScrollListener(scrollListener)
        }
    }

    private fun setupKeyboardAnimation() {
        ViewCompat.setWindowInsetsAnimationCallback(
            this,
            object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {

                private var distanceFromEnd: Int = 0

                override fun onPrepare(animation: WindowInsetsAnimationCompat) {
                    kbHeightAtAnimStart = keyboardHeightPx
                    isKeyboardAnimating = true
                    val offset = recyclerView.computeVerticalScrollOffset()
                    val contentH = recyclerView.computeVerticalScrollRange()
                    val rvH = recyclerView.height
                    distanceFromEnd = maxOf(0, contentH - offset - rvH)
                }

                override fun onStart(
                    animation: WindowInsetsAnimationCompat,
                    bounds: WindowInsetsAnimationCompat.BoundsCompat,
                ): WindowInsetsAnimationCompat.BoundsCompat = bounds

                override fun onProgress(
                    insets: WindowInsetsCompat,
                    runningAnimations: List<WindowInsetsAnimationCompat>,
                ): WindowInsetsCompat {
                    val kbH = extractKeyboardHeight(insets)
                    val shift = (kbH - kbHeightAtAnimStart).toFloat()
                    recyclerView.translationY = -shift
                    inputBar.translationY = -kbH.toFloat()
                    // FAB layout() position ignores keyboard (like inputBar), so use absolute -kbH.
                    fabButton.translationY = -kbH.toFloat()
                    return insets
                }
            },
        )
    }

    private fun setupAdapterCallbacks() {
        adapter.onMessagePress = { messageId ->
            sendEvent("onMessagePress", args { putString("messageId", messageId) })
        }
        adapter.onMessageLongPress = { messageId, anchorView, _ ->
            showContextMenu(messageId, anchorView)
        }
        adapter.onReplyPress = { replyId ->
            sendEvent("onReplyMessagePress", args { putString("messageId", replyId) })
        }
    }

    private fun extractKeyboardHeight(insets: WindowInsetsCompat): Int {
        val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
        val navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
        return maxOf(0, imeInsets.bottom - navInsets.bottom)
    }

    private fun applyKeyboardHeight(kbH: Int) {
        if (keyboardHeightPx == kbH || isKeyboardAnimating) return

        val rvHeightBefore = recyclerView.height
        val offsetBefore = recyclerView.computeVerticalScrollOffset()
        val contentH = recyclerView.computeVerticalScrollRange()
        val distanceFromEnd = maxOf(0, contentH - offsetBefore - rvHeightBefore)

        keyboardHeightPx = kbH
        inputBar.translationY = -kbH.toFloat()
        fabButton.translationY = -kbH.toFloat()

        val inputH = lastKnownInputBarHeight.takeIf { it > 0 }
            ?: inputBar.measuredHeight.takeIf { it > 0 }
            ?: inputBar.height
        val rvHeightNew = (height - inputH - kbH).coerceAtLeast(0)
        repositionViews()

        if (rvHeightNew > 0 && rvHeightNew != rvHeightBefore) {
            val contentHAfter = recyclerView.computeVerticalScrollRange()
            val targetOffset = contentHAfter - rvHeightNew - distanceFromEnd
            val currentOffset = recyclerView.computeVerticalScrollOffset()
            val delta = targetOffset - currentOffset
            if (kotlin.math.abs(delta) > 1) recyclerView.scrollBy(0, delta)
        }
    }

    /** Пересчитывает позиции всех дочерних вью с учётом клавиатуры и инпут-бара. */
    private fun repositionViews() {
        val w = width
        val h = height
        val kbH = keyboardHeightPx
        val inputH = lastKnownInputBarHeight.takeIf { it > 0 }
            ?: inputBar.height.takeIf { it > 0 }
            ?: return

        // Position inputBar explicitly: bottom = h - kbH, top = bottom - inputH
        val inputBottom = h - kbH
        val inputTop = inputBottom - inputH
        if (inputTop >= 0 && (inputBar.left != 0 || inputBar.top != inputTop
                    || inputBar.right != w || inputBar.bottom != inputBottom)) {
            inputBar.layout(0, inputTop, w, inputBottom)
        }

        val rvBottom = inputTop
        if (rvBottom > 0 && (recyclerView.left != 0 || recyclerView.top != 0
                    || recyclerView.right != w || recyclerView.bottom != rvBottom)) {
            recyclerView.layout(0, 0, w, rvBottom)
        }

        val newRvPadBottom = collectionExtraInsetBottom + context.dpToPx(C.COLLECTION_BOTTOM_PADDING_DP)
        val newRvPadTop = context.dpToPx(C.COLLECTION_TOP_PADDING_DP) + collectionExtraInsetTop
        if (recyclerView.paddingBottom != newRvPadBottom || recyclerView.paddingTop != newRvPadTop) {
            recyclerView.setPadding(0, newRvPadTop, 0, newRvPadBottom)
        }

        emptyStateView.setBottomOffset(inputH + kbH + collectionExtraInsetBottom)

        // FAB layout() position mirrors inputBar/RecyclerView — keyboard offset is handled
        // exclusively via translationY in onProgress, exactly like inputBar.
        val fabSize = fabButton.width.takeIf { it > 0 } ?: context.dpToPx(C.FAB_SIZE_DP)
        val fabMarginEnd = context.dpToPx(C.FAB_MARGIN_END_DP)
        val fabMarginBottom = context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
        val fabBottom = rvBottom - fabMarginBottom
        val fabTop = fabBottom - fabSize
        val fabRight = w - fabMarginEnd
        val fabLeft = fabRight - fabSize
        if (fabTop >= 0) fabButton.layout(fabLeft, fabTop, fabRight, fabBottom)
    }

    private fun syncLayout() = repositionViews()

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        // Always sync — during panel animation inputBar.height is the current animated value.
        val actualInputH = inputBar.height
        if (actualInputH > 0) lastKnownInputBarHeight = actualInputH
        repositionViews()
        if (pendingInitialScroll) {
            pendingInitialScroll = false
            recyclerView.post {
                doInitialScroll()
                layoutManager.stackFromEnd = false
            }
        }
    }

    // ─── Props API ────────────────────────────────────────────────────────

    /** Применяет новый список сообщений, определяет стратегию обновления и выполняет её. */
    fun setMessages(newMessages: List<ChatMessage>) {
        if (!initialScrollDone && newMessages.isNotEmpty() && pendingInitialScrollId == null) {
            layoutManager.stackFromEnd = true
        }
        val strategy = resolveStrategy(newMessages, messageIndex, sections)
        applyStrategy(strategy)
        updateLoadingState()
        updateFabVisibility(animated = false)
        lastKnownCount = newMessages.size
        if (strategy is UpdateStrategy.Prepend && !isLoading) {
            recyclerView.post { checkAndFireReachTopIfNeeded() }
        }
        if (!initialScrollDone && newMessages.isNotEmpty()) {
            initialScrollDone = true
            performInitialScroll()
        }
    }

    fun setActions(newActions: List<MessageAction>) { actions = newActions }

    fun setEmojiReactions(newEmojis: List<String>) { emojis = newEmojis }

    /** Применяет тему по имени ("light" / "dark"). */
    fun setTheme(name: String) {
        theme = ChatTheme.from(name)
        adapter.theme = theme
        applyThemeToViews()
    }

    /** Обновляет состояние загрузки (спиннер в EmptyState). */
    fun setIsLoading(loading: Boolean) {
        isLoading = loading
        if (!loading) {
            waitingForNewMessages = false
            recyclerView.post { checkAndFireReachTopIfNeeded() }
        }
        updateLoadingState()
    }

    fun setTopThreshold(value: Int) { topThreshold = context.dpToPx(value.toFloat()) }

    fun setScrollToBottomThreshold(value: Int) { scrollToBottomThreshold = context.dpToPx(value.toFloat()) }

    /** Задаёт id сообщения для начального скролла при первой загрузке. */
    fun setInitialScrollId(id: String?) {
        if (id == null) return
        if (!initialScrollDone) {
            pendingInitialScrollId = id
        } else if (pendingInitialScroll) {
            pendingInitialScrollId = id
            layoutManager.stackFromEnd = false
        } else {
            recyclerView.post {
                scrollToMessage(id, ChatScrollPosition.CENTER, animated = false, highlight = true)
            }
        }
    }

    /** Устанавливает дополнительные отступы коллекции (например, под плавающие элементы). */
    fun setCollectionInsets(top: Int, bottom: Int) {
        collectionExtraInsetTop = context.dpToPx(top.toFloat())
        collectionExtraInsetBottom = context.dpToPx(bottom.toFloat())
        syncLayout()
    }

    /** Применяет action из JS (reply / edit / none) к инпут-бару. */
    fun setInputAction(action: ChatInputAction) {
        when (action) {
            is ChatInputAction.Reply -> {
                val msg = messageIndex[action.messageId] ?: return
                inputBar.beginReply(
                    ReplyInfo(
                        replyToId = msg.id,
                        snapshotSenderName = msg.senderName,
                        snapshotText = msg.text,
                        snapshotHasImage = msg.hasImage,
                    ),
                    theme,
                )
            }
            is ChatInputAction.Edit -> {
                val msg = messageIndex[action.messageId] ?: return
                val text = msg.text ?: return
                inputBar.beginEdit(action.messageId, text, theme)
            }
            is ChatInputAction.None -> inputBar.cancelMode(theme)
        }
    }

    // ─── Commands ─────────────────────────────────────────────────────────

    /** Скроллит список к последнему сообщению. */
    fun scrollToBottom(animated: Boolean = true) {
        val last = adapter.itemCount - 1
        if (last < 0) return
        isProgrammaticScroll = true
        if (animated) {
            recyclerView.smoothScrollToPosition(last)
        } else {
            layoutManager.scrollToPositionWithOffset(last, 0)
            recyclerView.post {
                recyclerView.post {
                    val lastView = layoutManager.findViewByPosition(last)
                    if (lastView != null) {
                        val extra = lastView.bottom - (recyclerView.height - recyclerView.paddingBottom)
                        if (extra > 0) recyclerView.scrollBy(0, extra)
                    }
                    isProgrammaticScroll = false
                }
            }
            return
        }
        isProgrammaticScroll = false
    }

    /** Скроллит к сообщению с указанным id с опциональным highlight. */
    fun scrollToMessage(
        id: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.positionOfMessage(id)
        val lm = layoutManager
        val rv = recyclerView

        isProgrammaticScroll = true
        val scroller = object : LinearSmoothScroller(context) {
            override fun calculateTimeForScrolling(dx: Int): Int =
                if (animated) super.calculateTimeForScrolling(dx) else 1

            override fun getVerticalSnapPreference() = SNAP_TO_START

            override fun onTargetFound(targetView: View, state: RecyclerView.State, action: Action) {
                val padTop = rv.paddingTop
                val padBottom = rv.paddingBottom
                val visibleH = rv.height - padTop - padBottom
                val top = lm.getDecoratedTop(targetView)
                val height = lm.getDecoratedMeasuredHeight(targetView)
                val targetTop = when (position) {
                    ChatScrollPosition.TOP -> padTop
                    ChatScrollPosition.CENTER -> padTop + (visibleH - height) / 2
                    ChatScrollPosition.BOTTOM -> padTop + visibleH - height
                }
                val dy = top - targetTop
                if (dy != 0) {
                    val duration = if (animated) calculateTimeForDeceleration(abs(dy)) else 1
                    action.update(0, dy, duration, PathInterpolatorCompat.create(0.25f, 0.1f, 0.25f, 1f))
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

    // ─── Strategy application ──────────────────────────────────────────────

    private fun applyStrategy(strategy: UpdateStrategy) {
        sections = strategy.sections
        messageIndex = strategy.index
        when (strategy) {
            is UpdateStrategy.Prepend -> applyPrepend(strategy)
            is UpdateStrategy.Append -> applyAppend(strategy)
            is UpdateStrategy.Delete -> applyDelete(strategy)
            is UpdateStrategy.Update -> applyUpdate(strategy)
        }
    }

    private fun applyPrepend(s: UpdateStrategy.Prepend) {
        val anchorPos = layoutManager.findFirstVisibleItemPosition().takeIf { it >= 0 }
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorView = layoutManager.findViewByPosition(anchorPos)
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorTopBefore = anchorView.top
        val wasFling = recyclerView.scrollState == RecyclerView.SCROLL_STATE_SETTLING
        val velocityY = if (wasFling) captureVelocityY() else 0f
        val newAnchorPos = anchorPos + s.prependedCount

        val layoutListener = object : View.OnLayoutChangeListener {
            override fun onLayoutChange(v: View, l: Int, t: Int, r: Int, b: Int, ol: Int, ot: Int, or2: Int, ob: Int) {
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
                if (wasFling && velocityY != 0f) recyclerView.fling(0, velocityY.toInt())
            }
        }
        recyclerView.addOnLayoutChangeListener(layoutListener)
        isProgrammaticScroll = true
        adapter.submitSections(s.sections, s.index)
        isProgrammaticScroll = false
    }

    private fun captureVelocityY(): Float = try {
        val flingerField = RecyclerView::class.java.getDeclaredField("mViewFlinger").also { it.isAccessible = true }
        val flinger = flingerField.get(recyclerView) ?: return 0f
        val scrollerField = flinger.javaClass.getDeclaredField("mOverScroller").also { it.isAccessible = true }
        val scroller = scrollerField.get(flinger) as? android.widget.OverScroller ?: return 0f
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
            adapter.submitSections(s.sections, s.index, affectedIds = s.removedIds)
            return
        }
        views.forEach { view ->
            view.animate().alpha(0f).translationX(-view.width * 0.15f)
                .setDuration(animDuration)
                .setInterpolator(android.view.animation.AccelerateInterpolator(1.5f)).start()
        }
        recyclerView.postDelayed({
            views.forEach { it.alpha = 1f; it.translationX = 0f }
            adapter.submitSections(s.sections, s.index, affectedIds = s.removedIds)
            recyclerView.scrollBy(0, 0)
        }, animDuration)
    }

    private fun applyUpdate(s: UpdateStrategy.Update) {
        adapter.submitSections(s.sections, s.index, affectedIds = s.changedIds)
    }

    // ─── Initial scroll ───────────────────────────────────────────────────

    private fun performInitialScroll() { pendingInitialScroll = true }

    private fun doInitialScroll() {
        val targetId = pendingInitialScrollId
        if (targetId != null) {
            pendingInitialScrollId = null
            scrollToMessage(targetId, ChatScrollPosition.CENTER, animated = false, highlight = true)
        } else {
            scrollToBottom(animated = false)
            recyclerView.post { revealAfterInitialScroll() }
        }
    }

    private fun revealAfterInitialScroll() {
        if (recyclerView.alpha == 1f) return
        recyclerView.animate().alpha(1f).setDuration(120)
            .setInterpolator(android.view.animation.DecelerateInterpolator()).start()
    }

    // ─── Scroll helpers ────────────────────────────────────────────────────

    private fun scrollToBottomIfNearBottom() {
        if (distanceFromBottom() < scrollToBottomThreshold + context.dpToPx(50f)) {
            scrollToBottom(animated = true)
        }
    }

    private fun distanceFromBottom(): Int {
        val range = recyclerView.computeVerticalScrollRange()
        val offset = recyclerView.computeVerticalScrollOffset()
        // When the keyboard is open, recyclerView.height may not yet reflect the
        // reduced size (layout hasn't happened during animation). Subtract the
        // keyboard height to get the actual visible extent.
        val visibleHeight = (recyclerView.height - keyboardHeightPx).coerceAtLeast(0)
        val extent = minOf(recyclerView.computeVerticalScrollExtent(), visibleHeight)
        return maxOf(0, range - offset - extent)
    }

    private fun checkAndFireReachTopIfNeeded() {
        val distanceFromTop = recyclerView.computeVerticalScrollOffset()
        if (isLoading || waitingForNewMessages || distanceFromTop >= topThreshold) return
        waitingForNewMessages = true
        sendEvent("onReachTop", args { putDouble("distanceFromTop", distanceFromTop.toDouble()) })
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
            fabButton.alpha = if (show) 1f else 0f
            fabButton.visibility = if (show) View.VISIBLE else View.INVISIBLE
        }
    }

    private fun updateLoadingState() {
        val isEmpty = sections.isEmpty() || sections.all { it.messages.isEmpty() }
        emptyStateView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        if (isEmpty) emptyStateView.setLoading(isLoading)
    }

    private fun applyThemeToViews() {
        setBackgroundColor(theme.collectionBackground)
        recyclerView.setBackgroundColor(Color.TRANSPARENT)
        inputBar.applyTheme(theme)
        emptyStateView.applyTheme(theme)
        fabButton.applyTheme(theme)
    }

    private fun showContextMenu(messageId: String, anchor: View) {
        contextMenu?.dismiss()
        contextMenu = ContextMenuView(
            ctx = context,
            emojis = emojis,
            actions = actions.map { ContextMenuAction(it.id, it.title, it.systemImage, it.isDestructive) },
            isDark = theme.isDark,
            onEmojiSelected = { emoji ->
                sendEvent("onEmojiReactionSelect", args { putString("emoji", emoji); putString("messageId", messageId) })
            },
            onActionSelected = { action ->
                sendEvent("onActionPress", args { putString("actionId", action.id); putString("messageId", messageId) })
            },
            onDismiss = { contextMenu = null },
        )
        contextMenu?.show(anchor, messageId)
    }

    private fun trackVisibleMessages() {
        val first = layoutManager.findFirstVisibleItemPosition().takeIf { it >= 0 } ?: return
        val last = layoutManager.findLastVisibleItemPosition().takeIf { it >= 0 } ?: return
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

    private var pendingHighlightPosition: Int? = null

    private fun processPendingHighlight() {
        val pos = pendingHighlightPosition ?: return
        pendingHighlightPosition = null
        recyclerView.post { adapter.highlightItem(recyclerView, pos) }
    }

    private val scrollListener = object : RecyclerView.OnScrollListener() {
        private var lastEventMs = 0L
        private val throttleMs = 33L

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

            if (dy < 0 && !isProgrammaticScroll) {
                val distanceFromTop = rv.computeVerticalScrollOffset()
                if (!waitingForNewMessages && distanceFromTop < topThreshold) {
                    waitingForNewMessages = true
                    sendEvent("onReachTop", args { putDouble("distanceFromTop", distanceFromTop.toDouble()) })
                }
            }

            val now = System.currentTimeMillis()
            if (now - lastEventMs < throttleMs || isProgrammaticScroll) return
            lastEventMs = now
            sendEvent("onScroll", args {
                putDouble("x", 0.0)
                putDouble("y", rv.computeVerticalScrollOffset().toDouble())
            })
        }
    }

    private val inputBarDelegate = object : InputBarDelegate {
        override fun onSendText(text: String, replyToId: String?) {
            sendEvent("onSendMessage", args {
                putString("text", text)
                replyToId?.let { putString("replyToId", it) }
            })
        }

        override fun onEditText(text: String, messageId: String) {
            sendEvent("onEditMessage", args { putString("text", text); putString("messageId", messageId) })
        }

        override fun onCancelReply() = sendEvent("onCancelInputAction", args { putString("type", "reply") })
        override fun onCancelEdit() = sendEvent("onCancelInputAction", args { putString("type", "edit") })
        override fun onAttachmentPress() = sendEvent("onAttachmentPress", Arguments.createMap())

        override fun onHeightChanged(heightPx: Int, topPanelVisibleHeight: Int) {
            val prevHeight = lastKnownInputBarHeight
            lastKnownInputBarHeight = heightPx
            val delta = heightPx - prevHeight
            syncLayout()
            // Compensate scroll so messages do not jump as the bar grows or shrinks
            if (delta != 0) recyclerView.scrollBy(0, delta)
        }
    }

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id.takeIf { it != NO_ID } ?: return
        try {
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId) ?: return
            val surfaceId = UIManagerHelper.getSurfaceId(this)
            dispatcher.dispatchEvent(RNChatViewEvent(surfaceId, viewId, name, params))
        } catch (_: Exception) {}
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap = Arguments.createMap().also { it.block() }
}

private class RNChatViewEvent(
    surfaceId: Int, viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap,
) : Event<RNChatViewEvent>(surfaceId, viewId) {
    override fun getEventName() = mEventName
    override fun getEventData() = mEventData
}
