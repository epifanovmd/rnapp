package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.TextView
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
import com.rnapp.rnchatview.ChatLayoutConstants as C
import kotlin.math.abs

private const val TAG = "RNChatView"

class RNChatView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    private val recyclerView:   RecyclerView
    private val adapter:        ChatSectionedAdapter
    private val layoutManager:  LinearLayoutManager
    private val inputBar:       InputBarView
    private val emptyStateView: EmptyStateView
    private val fabButton:      FabButton
    private var contextMenu:    ContextMenuView? = null

    private var sections:     List<MessageSection>     = emptyList()
    private var messageIndex: Map<String, ChatMessage> = emptyMap()
    private var actions:      List<MessageAction>      = emptyList()
    private var emojis:       List<String>             = emptyList()
    private var theme:        ChatTheme                = ChatTheme.light()
    private var isLoading:    Boolean                  = false

    // ── Keyboard ──────────────────────────────────────────────────────────
    // Высота клавиатуры в px (без nav bar). Обновляется покадрово через
    // WindowInsetsAnimationCompat.
    private var keyboardHeightPx: Int = 0

    private var topThreshold:            Int = context.dpToPx(200f)
    private var scrollToBottomThreshold: Int = context.dpToPx(150f)
    private var collectionExtraInsetTop:    Int = 0
    private var collectionExtraInsetBottom: Int = 0

    private var lastKnownCount:        Int     = 0
    private var waitingForNewMessages: Boolean = false
    private var pendingInitialScrollId: String?  = null
    private var initialScrollDone:      Boolean  = false
    private var pendingInitialScroll:   Boolean  = false
    private var isProgrammaticScroll: Boolean = false
    private var isUserDragging:       Boolean = false
    private var fabVisible:           Boolean = false
    private var lastTopPanelHeight:   Int     = 0

    private val pendingVisibleIds    = mutableSetOf<String>()
    private val visibilityDebounceMs = 300L
    private val visibilityRunnable   = Runnable { flushVisibleIds() }

    init {
        clipChildren  = false
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
            // height=0: реальные bounds задаём вручную в repositionViews() через layout().
            // MATCH_PARENT заставил бы super.onLayout() каждый раз перекрывать
            // InputBar и ломать hit-testing.
            layoutParams   = LayoutParams(LayoutParams.MATCH_PARENT, 0)
            alpha          = 0f
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
                it.gravity      = Gravity.END or Gravity.BOTTOM
                it.marginEnd    = context.dpToPx(C.FAB_MARGIN_END_DP)
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

        // Пересчёт paddingBottom при изменении высоты InputBar (растёт textarea / topPanel)
        inputBar.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            if (bottom - top != oldBottom - oldTop) syncLayout()
        }

        // ── WindowInsetsAnimationCompat ───────────────────────────────────
        // Стратегия: на каждом кадре анимации IME получаем текущий
        // keyboard height (IME inset минус nav bar inset — то что реально
        // "сверху" nav bar), двигаем InputBar через translationY и
        // обновляем paddingBottom RecyclerView.
        //
        // DISPATCH_MODE_STOP: не пробрасываем в дочерние views — EditText
        // внутри InputBar не должен получать эти события независимо.
        ViewCompat.setWindowInsetsAnimationCallback(
            this,
            object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {

                override fun onPrepare(animation: WindowInsetsAnimationCompat) {}

                override fun onStart(
                    animation: WindowInsetsAnimationCompat,
                    bounds: WindowInsetsAnimationCompat.BoundsCompat,
                ): WindowInsetsAnimationCompat.BoundsCompat = bounds

                override fun onProgress(
                    insets: WindowInsetsCompat,
                    runningAnimations: List<WindowInsetsAnimationCompat>,
                ): WindowInsetsCompat {
                    val kbH = extractKeyboardHeight(insets)
                    applyKeyboardHeight(kbH)
                    return insets
                }

                override fun onEnd(animation: WindowInsetsAnimationCompat) {
                    val rootInsets = ViewCompat.getRootWindowInsets(this@RNChatView) ?: return
                    applyKeyboardHeight(extractKeyboardHeight(rootInsets))
                }
            },
        )

        // ── Adapter callbacks ─────────────────────────────────────────────
        adapter.onMessagePress = { messageId ->
            sendEvent("onMessagePress", args { putString("messageId", messageId) })
        }
        adapter.onMessageLongPress = { messageId, anchorView, _ ->
            showContextMenu(messageId, anchorView)
        }
        adapter.onReplyPress = { replyId ->
            sendEvent("onReplyMessagePress", args { putString("messageId", replyId) })
        }

        post {
            inputBar.delegate = inputBarDelegate
            recyclerView.addOnScrollListener(scrollListener)
        }
    }

    // ── Keyboard height extraction ────────────────────────────────────────
    //
    // imeBottom включает nav bar высоту когда nav bar находится под клавиатурой.
    // Нам нужна только высота самой клавиатуры над nav bar.
    // Правильная формула: max(0, imeBottom - navBarBottom).
    // Это точно соответствует высоте клавиатуры видимой пользователем.

    private fun extractKeyboardHeight(insets: WindowInsetsCompat): Int {
        val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
        val navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
        return maxOf(0, imeInsets.bottom - navInsets.bottom)
    }

    // ── Keyboard & Layout ────────────────────────────────────────────────
    //
    // Архитектура позиционирования:
    //
    //   RNChatView (FrameLayout, размеры задаёт RN/Yoga — не трогаем)
    //   ├── recyclerView  — вручную layout от top=0 до bottom=(height - inputH - kbH)
    //   ├── inputBar      — translationY = -kbH (визуально поднимается, layout остаётся внизу)
    //   ├── emptyState    — MATCH_PARENT
    //   └── fabButton     — gravity=BOTTOM, bottomMargin = inputH + kbH + FAB_MARGIN
    //
    // Почему вручную layout recyclerView а не MATCH_PARENT:
    //   Если recyclerView MATCH_PARENT, он перекрывает InputBar и перехватывает тачи
    //   в его зоне (inputBar добавлен после, но RecyclerView занимает весь экран и
    //   обрабатывает touch down до того как FrameLayout проверяет inputBar).
    //   Ограничивая реальный bottom recyclerView = top InputBar, тачи в зоне InputBar
    //   не попадают в recyclerView вообще.
    //
    // Почему translationY для inputBar (а не margin):
    //   translationY синхронно с анимацией IME (покадрово через WindowInsetsAnimation).
    //   Изменение margin требует requestLayout() — это дороже и может пропускать кадры.

    private fun applyKeyboardHeight(kbH: Int) {
        if (keyboardHeightPx == kbH) return
        keyboardHeightPx = kbH
        inputBar.translationY = -kbH.toFloat()
        fabButton.translationY = -kbH.toFloat()
        repositionViews()
    }

    // Пересчитываем позиции всех views. Вызывается при:
    //   - изменении высоты клавиатуры
    //   - изменении высоты InputBar
    //   - onLayout (включая первый layout pass от RN)

    private fun repositionViews() {
        val w      = width
        val h      = height
        val kbH    = keyboardHeightPx
        val inputH = inputBar.height.takeIf { it > 0 } ?: return

        // RecyclerView: от 0 до верхнего края InputBar с учётом клавиатуры
        val rvBottom = h - inputH - kbH
        if (rvBottom > 0 && (recyclerView.left != 0 || recyclerView.top != 0
                || recyclerView.right != w || recyclerView.bottom != rvBottom)) {
            recyclerView.layout(0, 0, w, rvBottom)
        }

        // RecyclerView padding (contentInset аналог iOS)
        val newRvPadBottom = collectionExtraInsetBottom + context.dpToPx(C.COLLECTION_BOTTOM_PADDING_DP)
        val newRvPadTop    = context.dpToPx(C.COLLECTION_TOP_PADDING_DP) + collectionExtraInsetTop
        if (recyclerView.paddingBottom != newRvPadBottom || recyclerView.paddingTop != newRvPadTop) {
            recyclerView.setPadding(0, newRvPadTop, 0, newRvPadBottom)
        }

        emptyStateView.setBottomOffset(inputH + kbH + collectionExtraInsetBottom)

        // FAB: bottomMargin над InputBar. kbH уже учтён через translationY (синхронно с клавиатурой).
        val lp = fabButton.layoutParams as? LayoutParams ?: return
        val newFabMargin = inputH + context.dpToPx(C.FAB_MARGIN_BOTTOM_DP)
        if (lp.bottomMargin != newFabMargin) {
            lp.bottomMargin = newFabMargin
            fabButton.layoutParams = lp
        }
    }

    // syncLayout — алиас для обратной совместимости с вызовами из onHeightChanged
    private fun syncLayout() = repositionViews()

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        // super.onLayout расставляет InputBar/FAB/emptyState по gravity,
        // затем мы корректируем recyclerView вручную.
        super.onLayout(changed, left, top, right, bottom)
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

    fun setTheme(name: String) {
        theme = ChatTheme.from(name)
        adapter.theme = theme
        applyThemeToViews()
    }

    fun setIsLoading(loading: Boolean) {
        isLoading = loading
        if (!loading) {
            waitingForNewMessages = false
            recyclerView.post { checkAndFireReachTopIfNeeded() }
        }
        updateLoadingState()
    }

    private fun checkAndFireReachTopIfNeeded() {
        val distanceFromTop = recyclerView.computeVerticalScrollOffset()
        if (isLoading || waitingForNewMessages || distanceFromTop >= topThreshold) return
        waitingForNewMessages = true
        sendEvent("onReachTop", args { putDouble("distanceFromTop", distanceFromTop.toDouble()) })
    }

    fun setTopThreshold(value: Int) { topThreshold = context.dpToPx(value.toFloat()) }
    fun setScrollToBottomThreshold(value: Int) { scrollToBottomThreshold = context.dpToPx(value.toFloat()) }

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

    fun setCollectionInsets(top: Int, bottom: Int) {
        collectionExtraInsetTop    = context.dpToPx(top.toFloat())
        collectionExtraInsetBottom = context.dpToPx(bottom.toFloat())
        syncLayout()
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

    fun scrollToMessage(
        id: String,
        position: ChatScrollPosition = ChatScrollPosition.CENTER,
        animated: Boolean = true,
        highlight: Boolean = true,
    ) {
        val pos = adapter.positionOfMessage(id)
        val lm  = layoutManager
        val rv  = recyclerView

        isProgrammaticScroll = true
        val scroller = object : LinearSmoothScroller(context) {
            override fun calculateTimeForScrolling(dx: Int): Int =
                if (animated) super.calculateTimeForScrolling(dx) else 1

            override fun getVerticalSnapPreference() = SNAP_TO_START

            override fun onTargetFound(targetView: View, state: RecyclerView.State, action: Action) {
                val padTop    = rv.paddingTop
                val padBottom = rv.paddingBottom
                val visibleH  = rv.height - padTop - padBottom
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
                    action.update(0, dy, duration,
                        PathInterpolatorCompat.create(0.25f, 0.1f, 0.25f, 1f))
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

    // ─── Strategy ────────────────────────────────────────────────────────

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
        val anchorPos = layoutManager.findFirstVisibleItemPosition().takeIf { it >= 0 }
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorView = layoutManager.findViewByPosition(anchorPos)
            ?: return run { adapter.submitSections(s.sections, s.index) }
        val anchorTopBefore = anchorView.top
        val wasFling  = recyclerView.scrollState == RecyclerView.SCROLL_STATE_SETTLING
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

    // ─── Scroll helpers ───────────────────────────────────────────────────

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
            ctx              = context,
            emojis           = emojis,
            actions          = actions,
            isDark           = theme.isDark,
            onEmojiSelected  = { emoji ->
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

    private var pendingHighlightPosition: Int? = null
    private fun processPendingHighlight() {
        val pos = pendingHighlightPosition ?: return
        pendingHighlightPosition = null
        recyclerView.post { adapter.highlightItem(recyclerView, pos) }
    }

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
        override fun onCancelEdit()  = sendEvent("onCancelInputAction", args { putString("type", "edit") })
        override fun onAttachmentPress() = sendEvent("onAttachmentPress", Arguments.createMap())

        override fun onHeightChanged(heightPx: Int, topPanelVisibleHeight: Int) {
            val delta = topPanelVisibleHeight - lastTopPanelHeight
            lastTopPanelHeight = topPanelVisibleHeight
            syncLayout()
            if (delta != 0) recyclerView.post { recyclerView.scrollBy(0, delta) }
        }
    }

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id.takeIf { it != NO_ID } ?: return
        try {
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId) ?: return
            val surfaceId  = UIManagerHelper.getSurfaceId(this)
            dispatcher.dispatchEvent(RNChatViewEvent(surfaceId, viewId, name, params))
        } catch (_: Exception) {}
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap = Arguments.createMap().also { it.block() }
}

private class EmptyStateView(context: Context) : FrameLayout(context) {
    private val label   = TextView(context)
    private val spinner = android.widget.ProgressBar(context)
    init {
        label.text     = "No messages yet.\nBe the first! 👋"
        label.gravity  = Gravity.CENTER
        label.textSize = 16f
        addView(label,   LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        addView(spinner, LayoutParams(context.dpToPx(40f), context.dpToPx(40f), Gravity.CENTER))
    }
    fun setBottomOffset(offsetPx: Int) {
        (label.layoutParams   as LayoutParams).bottomMargin = offsetPx; label.requestLayout()
        (spinner.layoutParams as LayoutParams).bottomMargin = offsetPx; spinner.requestLayout()
    }
    fun setLoading(loading: Boolean) {
        label.visibility   = if (loading) View.INVISIBLE else View.VISIBLE
        spinner.visibility = if (loading) View.VISIBLE   else View.GONE
    }
    fun applyTheme(theme: ChatTheme) = label.setTextColor(theme.emptyStateText)
}

private class FabButton(context: Context) : FrameLayout(context) {
    init {
        background  = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
        elevation   = context.dpToPx(C.FAB_ELEVATION_DP).toFloat()
        scaleX      = 0.7f; scaleY = 0.7f
        isClickable = true; isFocusable = true
        addView(TextView(context).apply {
            text = "↓"; textSize = 18f; gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        })
    }
    fun applyTheme(theme: ChatTheme) {
        (background as? GradientDrawable)?.setColor(theme.fabBackground)
        (getChildAt(0) as? TextView)?.setTextColor(theme.fabArrowColor)
    }
}

private class RNChatViewEvent(
    surfaceId: Int, viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap,
) : Event<RNChatViewEvent>(surfaceId, viewId) {
    override fun getEventName(): String      = mEventName
    override fun getEventData(): WritableMap = mEventData
}
