package com.rnapp.rnchatview

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Path
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.rnapp.rnchatview.ChatLayoutConstants as C

// ─── ContextMenuView ──────────────────────────────────────────────────────────
//
// Полный аналог iOS ContextMenuViewController:
//   • Снапшот исходного view — оригинал скрывается, снапшот анимируется в позицию
//   • Панель эмодзи сверху снапшота (scale+alpha spring вверх)
//   • Панель действий снизу снапшота (scale+alpha spring вниз)
//   • Backdrop (затемнение) с fade-in
//   • При закрытии — обратная анимация: панели схлопываются к снапшоту,
//     снапшот возвращается на место оригинала, оригинал появляется обратно
//   • ContextMenuLayoutEngine — идентичная iOS логика позиционирования

class ContextMenuView(
    private val ctx: Context,
    private val emojis: List<String>,
    private val actions: List<MessageAction>,
    private val isDark: Boolean,
    private val isMine: Boolean = false,
    private val onEmojiSelected: (String) -> Unit,
    private val onActionSelected: (MessageAction) -> Unit,
    private val onDismiss: () -> Unit,
) {

    private val theme = ContextMenuTheme(isDark)
    private var rootOverlay: FrameLayout? = null
    private var scrollView: ScrollView?   = null
    private var isDismissing = false
    private var anchorViewRef: View? = null   // держим ссылку чтобы вернуть alpha
    private var statusBarOffset: Float = 0f   // смещение статус бара в координатах decorView

    // ─── Show ─────────────────────────────────────────────────────────────

    fun show(anchor: View, messageId: String) {
        dismiss()
        isDismissing = false
        anchorViewRef = anchor

        val decorView = anchor.rootView as? ViewGroup ?: return

        // Получаем реальную видимую область — без статус бара и навигейшн бара.
        // getWindowVisibleDisplayFrame даёт именно видимый прямоугольник приложения.
        val visibleFrame = android.graphics.Rect()
        decorView.getWindowVisibleDisplayFrame(visibleFrame)
        val screenW = visibleFrame.width().toFloat()
        val screenH = visibleFrame.height().toFloat()
        // Смещение статус бара: overlay добавляется в decorView (координаты от верха экрана),
        // но anchorRect и layout рассчитываются в visible-координатах (от visibleFrame.top).
        // Все Y-координаты при размещении view нужно сдвигать на это значение.
        statusBarOffset = visibleFrame.top.toFloat()
        android.util.Log.d("ContextMenu", "visibleFrame: ${screenW}x${screenH} offset=(${visibleFrame.left},${visibleFrame.top})")

        // Позиция anchor в координатах видимой области (visibleFrame)
        val anchorLoc = IntArray(2).also { anchor.getLocationInWindow(it) }
        val anchorRect = RectF(
            (anchorLoc[0] - visibleFrame.left).toFloat(),
            (anchorLoc[1] - visibleFrame.top).toFloat(),
            (anchorLoc[0] - visibleFrame.left + anchor.width).toFloat(),
            (anchorLoc[1] - visibleFrame.top  + anchor.height).toFloat(),
        )

        // Построение панелей — снапшот всегда полного размера сообщения, скролл справится
        val emojiPanel   = if (emojis.isNotEmpty())  makeEmojiPanel()   else null
        val actionsPanel = if (actions.isNotEmpty()) makeActionsPanel() else null

        val emojiSz   = if (emojiPanel != null)   measureEmojiPanel(emojis.size)   else SizePair(0f, 0f)
        val actionsSz = if (actionsPanel != null) measureActionsPanel(actions.size) else SizePair(0f, 0f)

        val snapshotView = makeSnapshotView(anchor)
        val snapW = anchor.width.toFloat()
        val snapH = anchor.height.toFloat()

        val layout = ContextMenuLayoutEngine.calculate(
            anchorRect = anchorRect,
            snapW      = snapW,
            snapH      = snapH,
            emojiW     = emojiSz.w, emojiH = emojiSz.h,
            actionsW   = actionsSz.w, actionsH = actionsSz.h,
            screenW    = screenW, screenH = screenH,
            hPad       = ctx.dp(theme.horizontalPadding),
            vPad       = ctx.dp(theme.verticalPadding),
            emojiGap   = ctx.dp(theme.emojiPanelSpacing),
            actionsGap = ctx.dp(theme.menuSpacing)
        )
        android.util.Log.d("ContextMenu", "anchorRect=$anchorRect snap=${snapW}x${snapH}")
        android.util.Log.d("ContextMenu", "emojiSz=$emojiSz actionsSz=$actionsSz")
        android.util.Log.d("ContextMenu", "layout: needsScroll=${layout.needsScroll} canvasH=${layout.canvasH} scrollOffset=${layout.scrollOffset}")
        android.util.Log.d("ContextMenu", "snapTarget=${layout.snapTarget} emojiTarget=${layout.emojiTarget} actionsTarget=${layout.actionsTarget}")

        // Backdrop — полноэкранный, под скролл-вью
        val backdropDim = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            setBackgroundColor(theme.backdropColor)
            alpha = 0f
        }

        // Canvas — контейнер внутри ScrollView, высота задаётся явно
        // чтобы ScrollView видел реальный contentSize через WRAP_CONTENT дочернего view
        val canvas = FrameLayout(ctx).apply {
            minimumHeight = layout.canvasH.toInt()
        }
        snapshotView?.let { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(snapW.toInt(), snapH.toInt())) }
        emojiPanel?.let   { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(emojiSz.w.toInt(), emojiSz.h.toInt())) }
        actionsPanel?.let { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(actionsSz.w.toInt(), actionsSz.h.toInt())) }

        // ScrollView — на весь экран, скролл только если не влезает
        val sv = object : ScrollView(ctx) {
            override fun onTouchEvent(e: MotionEvent): Boolean {
                return if (layout.needsScroll) super.onTouchEvent(e) else false
            }
        }.apply {
            isVerticalScrollBarEnabled   = false
            isHorizontalScrollBarEnabled = false
            isFillViewport               = false
            overScrollMode               = View.OVER_SCROLL_NEVER
            setBackgroundColor(Color.TRANSPARENT)
            // WRAP_CONTENT — ScrollView уважает реальную высоту canvas (canvasH)
            // При isFillViewport=true ScrollView мог перезаписывать высоту дочернего view
            addView(canvas, ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
        }
        scrollView = sv

        // Root overlay — перехватывает тапы по backdrop, но пропускает к emoji/action панелям
        val root = object : FrameLayout(ctx) {
            override fun onInterceptTouchEvent(e: MotionEvent): Boolean {
                // Пропускаем события к дочерним views (emoji/actions) если тап внутри них
                val scrollY = sv.scrollY.toFloat()
                val canvasX = e.x
                val canvasY = e.y + scrollY
                val inEmoji   = emojiPanel?.hitTestCanvas(canvasX, canvasY)   ?: false
                val inActions = actionsPanel?.hitTestCanvas(canvasX, canvasY) ?: false
                // Если тап в панели — не перехватываем, пусть дочерний view обработает
                return !(inEmoji || inActions)
            }
            override fun onTouchEvent(e: MotionEvent): Boolean {
                if (e.action == MotionEvent.ACTION_UP && !isDismissing) {
                    val scrollY = sv.scrollY.toFloat()
                    val canvasX = e.x
                    val canvasY = e.y + scrollY
                    val inSnap    = snapshotView?.hitTestCanvas(canvasX, canvasY) ?: false
                    val inEmoji   = emojiPanel?.hitTestCanvas(canvasX, canvasY)   ?: false
                    val inActions = actionsPanel?.hitTestCanvas(canvasX, canvasY) ?: false
                    if (!inSnap && !inEmoji && !inActions) {
                        runClose(layout, snapshotView, emojiPanel, actionsPanel)
                    }
                }
                return if (layout.needsScroll) sv.onTouchEvent(e) else true
            }
        }
        rootOverlay = root

        root.addView(backdropDim)
        root.addView(sv)

        decorView.addView(root, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT).also {
            it.topMargin = statusBarOffset.toInt()
        })

        // anchor скрываем в prepareOpen — только когда снапшот уже размещён на его месте

        // Не вызываем prepareOpen здесь — делаем это в onGlobalLayout
        // когда знаем realScrollOffset и можем правильно рассчитать origin позиции

        sv.viewTreeObserver.addOnGlobalLayoutListener(object : android.view.ViewTreeObserver.OnGlobalLayoutListener {
            override fun onGlobalLayout() {
                sv.viewTreeObserver.removeOnGlobalLayoutListener(this)

                val contentBottom = maxOf(
                    layout.actionsTarget.bottom,
                    layout.snapTarget.bottom,
                    layout.emojiTarget.bottom,
                ) + ctx.dp(theme.verticalPadding)
                val realCanvasH      = contentBottom.toInt()
                val realScrollOffset = maxOf(0, realCanvasH - sv.height)

                android.util.Log.d("ContextMenu", "onGlobalLayout: sv=${sv.width}x${sv.height} realCanvasH=$realCanvasH realScrollOffset=$realScrollOffset")
                android.util.Log.d("ContextMenu", "anchorRect.top=${anchorRect.top} visAnchorTop=${anchorRect.top.coerceIn(0f, sv.height.toFloat())} originY=${anchorRect.top.coerceIn(0f, sv.height.toFloat()) + realScrollOffset}")
                android.util.Log.d("ContextMenu", "snapOrigin will be: y=${anchorRect.top.coerceIn(0f, sv.height.toFloat()) + realScrollOffset} snapTarget.top=${layout.snapTarget.top}")

                // Видимая на экране позиция anchor = clamp(anchorRect, 0..screenH).
                // В canvas-координатах = screenY + realScrollOffset.
                val visAnchorTop    = anchorRect.top.coerceIn(0f, screenH)
                val originY         = visAnchorTop + realScrollOffset
                val eGap = if (emojiSz.h > 0f) ctx.dp(theme.emojiPanelSpacing) else 0f
                val mGap = if (actionsSz.h > 0f) ctx.dp(theme.menuSpacing) else 0f

                val fixedLayout = layout.copy(
                    snapOrigin    = RectF(layout.snapOrigin.left, originY, layout.snapOrigin.right, originY + snapH),
                    emojiOrigin   = if (layout.hasEmoji)    RectF(layout.emojiOrigin.left,   originY - eGap - emojiSz.h,  layout.emojiOrigin.right,   originY - eGap)                          else RectF(),
                    actionsOrigin = if (layout.hasActions) RectF(layout.actionsOrigin.left, originY + snapH + mGap, layout.actionsOrigin.right, originY + snapH + mGap + actionsSz.h) else RectF(),
                    scrollOffset  = realScrollOffset.toFloat(),
                )
                currentLayout = fixedLayout

                fun applyScrollAndAnimate() {
                    prepareOpen(fixedLayout, snapshotView, emojiPanel, actionsPanel)
                    if (realScrollOffset > 0) {
                        sv.scrollTo(0, realScrollOffset)
                        android.util.Log.d("ContextMenu", "scrollY after scrollTo=${sv.scrollY}")
                    }
                    animateOpen(fixedLayout, backdropDim, snapshotView, emojiPanel, actionsPanel)
                }

                if (canvas.minimumHeight != realCanvasH) {
                    canvas.minimumHeight = realCanvasH
                    sv.post { applyScrollAndAnimate() }
                } else {
                    applyScrollAndAnimate()
                }
            }
        })
    }

    // ─── Dismiss (без анимации — для external forced dismiss) ─────────────

    fun dismiss() {
        val root = rootOverlay ?: return
        anchorViewRef?.alpha = 1f
        anchorViewRef = null
        try { (root.parent as? ViewGroup)?.removeView(root) } catch (_: Exception) {}
        rootOverlay = null
        scrollView  = null
        isDismissing = false
    }

    // ─── Snapshot ─────────────────────────────────────────────────────────

    private fun makeSnapshotView(source: View): View? {
        if (source.width <= 0 || source.height <= 0) return null
        val bmp = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
        source.draw(Canvas(bmp))

        val cornerPx = ctx.dp(C.BUBBLE_CORNER_RADIUS_DP)
        val iv = object : ImageView(ctx) {
            private val clipPath = Path()
            private val clipRF   = RectF()
            override fun onSizeChanged(w: Int, h: Int, ow: Int, oh: Int) {
                clipRF.set(0f, 0f, w.toFloat(), h.toFloat())
                clipPath.reset()
                clipPath.addRoundRect(clipRF, cornerPx, cornerPx, Path.Direction.CW)
            }
            override fun onDraw(canvas: Canvas) {
                canvas.save(); canvas.clipPath(clipPath); super.onDraw(canvas); canvas.restore()
            }
        }
        iv.setImageBitmap(bmp)
        iv.scaleType = ImageView.ScaleType.FIT_XY

        val wrapper = FrameLayout(ctx).apply { elevation = ctx.dp(6f) }
        wrapper.addView(iv, FrameLayout.LayoutParams(source.width, source.height))
        return wrapper
    }

    // ─── Emoji panel ──────────────────────────────────────────────────────

    private fun makeEmojiPanel(): LinearLayout {
        val padPx = ctx.dpI(10f)
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = Gravity.CENTER_VERTICAL
            setPadding(padPx, ctx.dpI(6f), padPx, ctx.dpI(6f))
            background = roundedBg(theme.emojiPanelBackground, theme.emojiPanelCornerRadius)
            elevation  = ctx.dp(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline   = true
            emojis.forEach { addView(makeEmojiButton(it)) }
        }
    }

    private fun makeEmojiButton(emoji: String): TextView {
        val sz = ctx.dpI(theme.emojiItemSize.toFloat())
        return TextView(ctx).apply {
            text     = emoji
            setTextSize(TypedValue.COMPLEX_UNIT_SP, theme.emojiFontSize)
            gravity  = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(sz, sz)
            isClickable = true; isFocusable = true
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN ->
                        v.animate().scaleX(0.75f).scaleY(0.75f).setDuration(100).start()
                    MotionEvent.ACTION_UP -> {
                        v.animate().scaleX(1f).scaleY(1f).setDuration(200)
                            .setInterpolator(OvershootInterpolator(0.8f)).start()
                        onEmojiSelected(emoji)
                        val root = rootOverlay
                        val layout = currentLayout
                        if (root != null && layout != null) {
                            runClose(layout, findSnap(root), findEmoji(root), findActions(root))
                        }
                    }
                    MotionEvent.ACTION_CANCEL ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(150).start()
                }
                true
            }
        }
    }

    private fun measureEmojiPanel(count: Int): SizePair {
        val itemPx = ctx.dp(theme.emojiItemSize.toFloat())
        val hPad   = ctx.dp(10f) * 2
        val vPad   = ctx.dp(12f)
        return SizePair(count * itemPx + hPad, itemPx + vPad)
    }

    // ─── Actions panel ────────────────────────────────────────────────────

    private fun makeActionsPanel(): LinearLayout {
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background  = roundedBg(theme.menuBackground, theme.menuCornerRadius)
            elevation   = ctx.dp(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline   = true
            for ((idx, action) in actions.withIndex()) {
                addView(makeActionRow(action))
                if (idx < actions.size - 1) addView(makeSeparator())
            }
        }
    }

    private fun makeActionRow(action: MessageAction): FrameLayout {
        val hPad = ctx.dpI(theme.actionHorizontalPadding.toFloat())
        val hPx  = ctx.dpI(theme.actionItemHeight.toFloat())
        val titleColor = if (action.isDestructive) theme.actionDestructiveColor else theme.actionTitleColor

        val label = TextView(ctx).apply {
            text      = action.title
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTextColor(titleColor)
            gravity   = Gravity.CENTER_VERTICAL
            setPadding(hPad, 0, hPad, 0)
        }
        val highlight = View(ctx).apply {
            setBackgroundColor(theme.actionHighlightColor); alpha = 0f
        }
        return FrameLayout(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, hPx)
            isClickable = true; isFocusable = true
            addView(label,     FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(highlight, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN  -> highlight.animate().alpha(1f).setDuration(80).start()
                    MotionEvent.ACTION_UP    -> {
                        highlight.animate().alpha(0f).setDuration(180).start()
                        onActionSelected(action)
                        val root = rootOverlay
                        val layout = currentLayout
                        if (root != null && layout != null) {
                            runClose(layout, findSnap(root), findEmoji(root), findActions(root))
                        }
                    }
                    MotionEvent.ACTION_CANCEL -> highlight.animate().alpha(0f).setDuration(180).start()
                }
                true
            }
        }
    }

    private fun makeSeparator() = View(ctx).apply {
        layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, 1).apply {
            marginStart = ctx.dpI(16f); marginEnd = ctx.dpI(16f)
        }
        setBackgroundColor(theme.separatorColor)
    }

    private fun measureActionsPanel(count: Int): SizePair {
        val itemH = ctx.dp(theme.actionItemHeight.toFloat())
        val total = count * itemH + maxOf(0, count - 1).toFloat()
        return SizePair(ctx.dp(theme.menuWidth.toFloat()), total)
    }

    // ─── Layout cache (needed inside closures) ─────────────────────────────

    private var currentLayout: ContextMenuLayout? = null

    // ─── Pre-open: расставляем в origin позиции ────────────────────────────

    private fun prepareOpen(layout: ContextMenuLayout, snap: View?, emoji: View?, actions: View?) {
        currentLayout = layout
        // Скрываем оригинал только здесь — снапшот уже размещён на его месте, моргания нет
        anchorViewRef?.alpha = 0f
        snap?.apply { alpha = 1f; placeAt(layout.snapOrigin) }
        emoji?.apply {
            placeAt(layout.emojiOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = height.toFloat()
            alpha  = 0f
        }
        actions?.apply {
            placeAt(layout.actionsOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = 0f
            alpha  = 0f
        }
    }

    // ─── Animate open ──────────────────────────────────────────────────────

    private fun animateOpen(layout: ContextMenuLayout, backdrop: View, snap: View?, emoji: View?, actions: View?) {
        val openMs = (theme.openDuration * 1000).toLong()

        // 1. Backdrop fade-in
        backdrop.animate().alpha(1f)
            .setDuration((openMs * 0.55).toLong())
            .setInterpolator(DecelerateInterpolator()).start()

        // 2. Снапшот spring к target позиции
        snap?.let { springToRect(it, layout.snapTarget, openMs, 0.82f) }

        // 3. Actions panel: scale вверх + slide + fade (из-под снапа вниз)
        actions?.let {
            it.pivotX = it.width / 2f; it.pivotY = 0f
            springPanelOpen(it, layout.actionsTarget, openMs, 0.82f)
        }

        // 4. Emoji panel: scale вверх + slide + fade (из-над снапа вверх)
        emoji?.let {
            it.pivotX = it.width / 2f; it.pivotY = it.height.toFloat()
            springPanelOpen(it, layout.emojiTarget, openMs, 0.72f)
        }
    }

    // ─── Animate close (обратная последовательность) ──────────────────────

    private fun runClose(layout: ContextMenuLayout, snap: View?, emoji: View?, actions: View?) {
        if (isDismissing) return
        isDismissing = true

        val root    = rootOverlay ?: return
        val backdrop = root.getChildAt(0)
        val closeMs = (theme.closeDuration * 1000).toLong()

        // Учитываем текущий scrollY — снапшот должен вернуться туда где виден anchor.
        // Аналог iOS: let offset = scrollView.contentOffset.y
        //             let returnFrame = CGRect(x: ..., y: srcInView.minY + offset, ...)
        val currentScrollY = scrollView?.scrollY?.toFloat() ?: 0f
        val adjustedSnapOrigin = RectF(
            layout.snapOrigin.left,
            layout.snapOrigin.top  - currentScrollY,
            layout.snapOrigin.right,
            layout.snapOrigin.bottom - currentScrollY,
        )
        val adjustedEmojiOrigin = RectF(
            layout.emojiOrigin.left,
            layout.emojiOrigin.top  - currentScrollY,
            layout.emojiOrigin.right,
            layout.emojiOrigin.bottom - currentScrollY,
        )
        val adjustedActionsOrigin = RectF(
            layout.actionsOrigin.left,
            layout.actionsOrigin.top  - currentScrollY,
            layout.actionsOrigin.right,
            layout.actionsOrigin.bottom - currentScrollY,
        )

        // 1. Backdrop fade-out
        backdrop?.animate()?.alpha(0f)?.setDuration(closeMs)?.start()

        // 2. Emoji схлопывается вниз к снапшоту
        emoji?.let {
            it.pivotX = it.width / 2f; it.pivotY = it.height.toFloat()
            AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(it, View.X, adjustedEmojiOrigin.left),
                    ObjectAnimator.ofFloat(it, View.Y, adjustedEmojiOrigin.top),
                    ObjectAnimator.ofFloat(it, View.SCALE_X, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.SCALE_Y, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.ALPHA, 0f),
                )
                duration = closeMs; interpolator = DecelerateInterpolator(); start()
            }
        }

        // 3. Actions схлопывается вверх к снапшоту
        actions?.let {
            it.pivotX = it.width / 2f; it.pivotY = 0f
            AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(it, View.X, adjustedActionsOrigin.left),
                    ObjectAnimator.ofFloat(it, View.Y, adjustedActionsOrigin.top),
                    ObjectAnimator.ofFloat(it, View.SCALE_X, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.SCALE_Y, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.ALPHA, 0f),
                )
                duration = closeMs; interpolator = DecelerateInterpolator(); start()
            }
        }

        // 4. Снапшот возвращается на место оригинала
        snap?.let { springToRect(it, adjustedSnapOrigin, closeMs, 0.9f) }

        // 5. По завершении: убираем overlay, восстанавливаем оригинал
        root.postDelayed({
            (root.parent as? ViewGroup)?.removeView(root)
            rootOverlay = null
            scrollView  = null
            anchorViewRef?.alpha = 1f  // оригинал появляется обратно
            anchorViewRef = null
            onDismiss()
        }, closeMs + 16)
    }

    // ─── Animation helpers ────────────────────────────────────────────────

    private fun springToRect(view: View, target: RectF, durationMs: Long, damping: Float) {
        val interp = OvershootInterpolator((1f - damping) * 2f)
        val xA = ObjectAnimator.ofFloat(view, View.X, target.left)
        val yA = ObjectAnimator.ofFloat(view, View.Y, target.top)
        val wA = ValueAnimator.ofInt(view.width, target.width().toInt()).also {
            it.addUpdateListener { a ->
                view.layoutParams?.width = a.animatedValue as Int; view.requestLayout()
            }
        }
        val hA = ValueAnimator.ofInt(view.height, target.height().toInt()).also {
            it.addUpdateListener { a ->
                view.layoutParams?.height = a.animatedValue as Int; view.requestLayout()
            }
        }
        AnimatorSet().apply { playTogether(xA, yA, wA, hA); duration = durationMs; interpolator = interp; start() }
    }

    private fun springPanelOpen(view: View, target: RectF, durationMs: Long, damping: Float) {
        val interp = OvershootInterpolator((1f - damping) * 3f)
        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, View.X, target.left),
                ObjectAnimator.ofFloat(view, View.Y, target.top),
                ObjectAnimator.ofFloat(view, View.SCALE_X, 1f),
                ObjectAnimator.ofFloat(view, View.SCALE_Y, 1f),
                ObjectAnimator.ofFloat(view, View.ALPHA, 1f),
            )
            duration = durationMs; interpolator = interp; start()
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private fun roundedBg(color: Int, cornerDp: Int): GradientDrawable =
        GradientDrawable().apply { setColor(color); cornerRadius = ctx.dp(cornerDp.toFloat()) }

    private fun View.placeAt(r: RectF) {
        x = r.left; y = r.top
        val lp = layoutParams ?: return
        lp.width = r.width().toInt(); lp.height = r.height().toInt(); layoutParams = lp
    }

    private fun View.hitTestCanvas(canvasX: Float, canvasY: Float) =
        canvasX >= x && canvasX <= x + width && canvasY >= y && canvasY <= y + height

    // canvas — второй child root (0=backdrop, 1=scrollView), внутри scrollView → canvas
    private fun getCanvas(): FrameLayout? =
        (rootOverlay?.getChildAt(1) as? ScrollView)?.getChildAt(0) as? FrameLayout

    private fun findSnap(root: FrameLayout)    = getCanvas()?.getChildAt(0)
    private fun findEmoji(root: FrameLayout)   = getCanvas()?.let { c -> if (c.childCount > 1) c.getChildAt(1) else null }
    private fun findActions(root: FrameLayout) = getCanvas()?.let { c ->
        when (c.childCount) {
            3    -> c.getChildAt(2)
            2    -> c.getChildAt(1).takeIf { emojis.isEmpty() }
            else -> null
        }
    }

    companion object {
        private const val OPEN_SCALE  = 0.5f
        private const val CLOSE_SCALE = 0.5f
    }
}

// ─── Layout data ──────────────────────────────────────────────────────────────

data class SizePair(val w: Float, val h: Float)

data class ContextMenuLayout(
    val snapTarget:    RectF,
    val emojiTarget:   RectF,
    val actionsTarget: RectF,
    val snapOrigin:    RectF,
    val emojiOrigin:   RectF,
    val actionsOrigin: RectF,
    val hasEmoji:      Boolean,
    val hasActions:    Boolean,
    val canvasH:       Float,
    val needsScroll:   Boolean,
    val scrollOffset:  Float,
)

// ─── ContextMenuLayoutEngine ──────────────────────────────────────────────────

object ContextMenuLayoutEngine {

    fun calculate(
        anchorRect: RectF,
        snapW: Float, snapH: Float,
        emojiW: Float, emojiH: Float,
        actionsW: Float, actionsH: Float,
        screenW: Float, screenH: Float,
        hPad: Float, vPad: Float,
        emojiGap: Float, actionsGap: Float,
        isMine: Boolean = false,
    ): ContextMenuLayout {
        val hasEmoji   = emojiH > 0
        val hasActions = actionsH > 0
        val eGap = if (hasEmoji) emojiGap else 0f
        val mGap = if (hasActions) actionsGap else 0f

        val topLimit    = vPad
        val bottomLimit = screenH - vPad

        val snapX = if (isMine)
            clamp(anchorRect.right - snapW, hPad, screenW - snapW - hPad)
        else
            clamp(anchorRect.left,          hPad, screenW - snapW - hPad)

        val emojiX = if (hasEmoji) {
            if (isMine) clamp(snapX + snapW - emojiW, hPad, screenW - emojiW - hPad)
            else        clamp(snapX,                  hPad, screenW - emojiW - hPad)
        } else 0f

        val menuX = if (hasActions) {
            if (isMine) clamp(snapX + snapW - actionsW, hPad, screenW - actionsW - hPad)
            else        clamp(snapX,                    hPad, screenW - actionsW - hPad)
        } else 0f

        val totalH      = emojiH + eGap + snapH + mGap + actionsH
        val needsScroll = totalH > bottomLimit - topLimit

        val emojiY: Float
        val snapY: Float
        val menuY: Float
        val canvasH: Float
        val scrollOffset: Float

        if (needsScroll) {
            // Всё содержимое укладывается с topLimit — canvas выше экрана
            // Начальный scrollOffset показывает низ (actions панель видна сразу)
            emojiY       = topLimit
            snapY        = emojiY + emojiH + eGap
            menuY        = snapY  + snapH  + mGap
            canvasH      = menuY  + actionsH + vPad
            scrollOffset = maxOf(0f, canvasH - screenH)
        } else {
            val blockTop = clamp(anchorRect.top - emojiH - eGap, topLimit, bottomLimit - totalH)
            emojiY       = blockTop
            snapY        = emojiY + emojiH + eGap
            menuY        = snapY  + snapH  + mGap
            canvasH      = screenH
            scrollOffset = 0f
        }

        // Origin позиции учитывают scrollOffset — снапшот стартует там где anchor виден на экране
        val originY = anchorRect.top + scrollOffset

        return ContextMenuLayout(
            snapTarget    = RectF(snapX,  snapY,  snapX  + snapW,   snapY  + snapH),
            emojiTarget   = if (hasEmoji)   RectF(emojiX, emojiY,   emojiX + emojiW, emojiY + emojiH) else RectF(),
            actionsTarget = if (hasActions) RectF(menuX,  menuY,    menuX  + actionsW, menuY + actionsH) else RectF(),
            snapOrigin    = RectF(anchorRect.left, originY, anchorRect.left + snapW, originY + snapH),
            emojiOrigin   = if (hasEmoji)   RectF(emojiX, originY - eGap - emojiH, emojiX + emojiW, originY - eGap) else RectF(),
            actionsOrigin = if (hasActions) RectF(menuX,  originY + snapH + mGap, menuX + actionsW, originY + snapH + mGap + actionsH) else RectF(),
            hasEmoji      = hasEmoji,
            hasActions    = hasActions,
            canvasH       = canvasH,
            needsScroll   = needsScroll,
            scrollOffset  = scrollOffset,
        )
    }

    private fun clamp(v: Float, lo: Float, hi: Float) = maxOf(lo, minOf(v, hi))
}

// ─── ContextMenuTheme ─────────────────────────────────────────────────────────

class ContextMenuTheme(isDark: Boolean) {
    val backdropColor: Int           = if (isDark) Color.argb(128, 0, 0, 0) else Color.argb(77, 0, 0, 0)
    val emojiPanelBackground: Int    = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val emojiPanelCornerRadius: Int  = 16
    val emojiFontSize: Float         = 20f
    val emojiItemSize: Int           = 36
    val menuBackground: Int          = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val menuCornerRadius: Int        = 12
    val separatorColor: Int          = if (isDark) Color.argb(31, 255, 255, 255) else Color.argb(31, 0, 0, 0)
    val actionTitleColor: Int        = if (isDark) Color.rgb(235, 235, 235) else Color.BLACK
    val actionDestructiveColor: Int  = Color.rgb(255, 59, 48)
    val actionHighlightColor: Int    = if (isDark) Color.argb(60, 255, 255, 255) else Color.argb(30, 0, 0, 0)
    val actionItemHeight: Int        = 48
    val actionHorizontalPadding: Int = 14
    val openDuration: Double         = 0.40
    val closeDuration: Double        = 0.26
    val emojiPanelSpacing: Float     = 6f
    val menuSpacing: Float           = 6f
    val horizontalPadding: Float     = 12f
    val verticalPadding: Float       = 10f
    val menuWidth: Int               = 220
}

// ─── dp helpers ───────────────────────────────────────────────────────────────

private fun Context.dp(dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)

private fun Context.dpI(dp: Float): Int = dp(dp).toInt()
