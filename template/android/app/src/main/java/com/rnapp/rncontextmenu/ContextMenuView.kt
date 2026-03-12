package com.rnapp.rncontextmenu

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

class ContextMenuView(
    private val ctx: Context,
    private val emojis: List<String>,
    private val actions: List<ContextMenuAction>,
    private val isDark: Boolean,
    private val isMine: Boolean = false,
    private val onEmojiSelected: (String) -> Unit,
    private val onActionSelected: (ContextMenuAction) -> Unit,
    private val onDismiss: () -> Unit,
) {

    private val theme = ContextMenuTheme(isDark)
    private var rootOverlay: FrameLayout? = null
    private var scrollView: ScrollView? = null
    private var isDismissing = false
    private var anchorViewRef: View? = null
    private var currentLayout: ContextMenuLayout? = null

    /** Показывает контекстное меню поверх anchor-вью. */
    fun show(anchor: View, menuId: String) {
        dismiss()
        isDismissing = false
        anchorViewRef = anchor

        val decorView = anchor.rootView as? ViewGroup ?: return
        val visibleFrame = android.graphics.Rect()
        decorView.getWindowVisibleDisplayFrame(visibleFrame)
        val screenW = visibleFrame.width().toFloat()
        val screenH = visibleFrame.height().toFloat()
        val statusBarOffset = visibleFrame.top.toFloat()

        val anchorLoc = IntArray(2).also { anchor.getLocationInWindow(it) }
        val anchorRect = RectF(
            (anchorLoc[0] - visibleFrame.left).toFloat(),
            (anchorLoc[1] - visibleFrame.top).toFloat(),
            (anchorLoc[0] - visibleFrame.left + anchor.width).toFloat(),
            (anchorLoc[1] - visibleFrame.top + anchor.height).toFloat(),
        )

        val emojiPanel = if (emojis.isNotEmpty()) makeEmojiPanel() else null
        val actionsPanel = if (actions.isNotEmpty()) makeActionsPanel() else null

        val emojiSz = if (emojiPanel != null) measureEmojiPanel(emojis.size) else SizePair(0f, 0f)
        val actionsSz = if (actionsPanel != null) measureActionsPanel(actions.size) else SizePair(0f, 0f)

        val snapshotView = makeSnapshotView(anchor)
        val snapW = anchor.width.toFloat()
        val snapH = anchor.height.toFloat()

        val layout = ContextMenuLayoutEngine.calculate(
            anchorRect = anchorRect,
            snapW = snapW, snapH = snapH,
            emojiW = emojiSz.w, emojiH = emojiSz.h,
            actionsW = actionsSz.w, actionsH = actionsSz.h,
            screenW = screenW, screenH = screenH,
            hPad = ctx.dp(theme.horizontalPadding),
            vPad = ctx.dp(theme.verticalPadding),
            emojiGap = ctx.dp(theme.emojiPanelSpacing),
            actionsGap = ctx.dp(theme.menuSpacing),
        )

        val backdropDim = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            setBackgroundColor(theme.backdropColor)
            alpha = 0f
        }

        val canvas = FrameLayout(ctx).apply {
            minimumHeight = layout.canvasH.toInt()
        }
        snapshotView?.let { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(snapW.toInt(), snapH.toInt())) }
        emojiPanel?.let { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(emojiSz.w.toInt(), emojiSz.h.toInt())) }
        actionsPanel?.let { it.alpha = 0f; canvas.addView(it, FrameLayout.LayoutParams(actionsSz.w.toInt(), actionsSz.h.toInt())) }

        val sv = buildScrollView(ctx, layout, canvas)
        scrollView = sv

        val root = buildRootOverlay(ctx, sv, layout, snapshotView, emojiPanel, actionsPanel)
        rootOverlay = root

        root.addView(backdropDim)
        root.addView(sv)

        decorView.addView(root, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT).also {
            it.topMargin = statusBarOffset.toInt()
        })

        sv.viewTreeObserver.addOnGlobalLayoutListener(object : android.view.ViewTreeObserver.OnGlobalLayoutListener {
            override fun onGlobalLayout() {
                sv.viewTreeObserver.removeOnGlobalLayoutListener(this)

                val contentBottom = maxOf(
                    layout.actionsTarget.bottom,
                    layout.snapTarget.bottom,
                    layout.emojiTarget.bottom,
                ) + ctx.dp(theme.verticalPadding)
                val realCanvasH = contentBottom.toInt()
                val realScrollOffset = maxOf(0, realCanvasH - sv.height)

                val visAnchorTop = anchorRect.top.coerceIn(0f, screenH)
                val originY = visAnchorTop + realScrollOffset
                val eGap = if (emojiSz.h > 0f) ctx.dp(theme.emojiPanelSpacing) else 0f
                val mGap = if (actionsSz.h > 0f) ctx.dp(theme.menuSpacing) else 0f

                val fixedLayout = layout.copy(
                    snapOrigin = RectF(layout.snapOrigin.left, originY, layout.snapOrigin.right, originY + snapH),
                    emojiOrigin = if (layout.hasEmoji) RectF(layout.emojiOrigin.left, originY - eGap - emojiSz.h, layout.emojiOrigin.right, originY - eGap) else RectF(),
                    actionsOrigin = if (layout.hasActions) RectF(layout.actionsOrigin.left, originY + snapH + mGap, layout.actionsOrigin.right, originY + snapH + mGap + actionsSz.h) else RectF(),
                    scrollOffset = realScrollOffset.toFloat(),
                )
                currentLayout = fixedLayout

                fun applyScrollAndAnimate() {
                    prepareOpen(fixedLayout, snapshotView, emojiPanel, actionsPanel)
                    if (realScrollOffset > 0) sv.scrollTo(0, realScrollOffset)
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

    /** Скрывает контекстное меню без анимации. */
    fun dismiss() {
        val root = rootOverlay ?: return
        anchorViewRef?.alpha = 1f
        anchorViewRef = null
        try { (root.parent as? ViewGroup)?.removeView(root) } catch (_: Exception) {}
        rootOverlay = null
        scrollView = null
        isDismissing = false
    }

    private fun makeSnapshotView(source: View): View? {
        if (source.width <= 0 || source.height <= 0) return null
        val bmp = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
        source.draw(Canvas(bmp))

        val cornerPx = ctx.dp(16f)
        val iv = object : ImageView(ctx) {
            private val clipPath = Path()
            private val clipRF = RectF()
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

    private fun makeEmojiPanel(): LinearLayout {
        val padPx = ctx.dpI(10f)
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(padPx, ctx.dpI(6f), padPx, ctx.dpI(6f))
            background = roundedBg(theme.emojiPanelBackground, theme.emojiPanelCornerRadius)
            elevation = ctx.dp(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline = true
            emojis.forEach { addView(makeEmojiButton(it)) }
        }
    }

    private fun makeEmojiButton(emoji: String): TextView {
        val sz = ctx.dpI(theme.emojiItemSize.toFloat())
        return TextView(ctx).apply {
            text = emoji
            setTextSize(TypedValue.COMPLEX_UNIT_SP, theme.emojiFontSize)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(sz, sz)
            isClickable = true; isFocusable = true
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> v.animate().scaleX(0.75f).scaleY(0.75f).setDuration(100).start()
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
                    MotionEvent.ACTION_CANCEL -> v.animate().scaleX(1f).scaleY(1f).setDuration(150).start()
                }
                true
            }
        }
    }

    private fun measureEmojiPanel(count: Int): SizePair {
        val itemPx = ctx.dp(theme.emojiItemSize.toFloat())
        val hPad = ctx.dp(10f) * 2
        val vPad = ctx.dp(12f)
        return SizePair(count * itemPx + hPad, itemPx + vPad)
    }

    private fun makeActionsPanel(): LinearLayout {
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background = roundedBg(theme.menuBackground, theme.menuCornerRadius)
            elevation = ctx.dp(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline = true
            for ((idx, action) in actions.withIndex()) {
                addView(makeActionRow(action))
                if (idx < actions.size - 1) addView(makeSeparator())
            }
        }
    }

    private fun makeActionRow(action: ContextMenuAction): FrameLayout {
        val hPad = ctx.dpI(theme.actionHorizontalPadding.toFloat())
        val hPx = ctx.dpI(theme.actionItemHeight.toFloat())
        val titleColor = if (action.isDestructive) theme.actionDestructiveColor else theme.actionTitleColor

        val label = TextView(ctx).apply {
            text = action.title
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTextColor(titleColor)
            gravity = Gravity.CENTER_VERTICAL
            setPadding(hPad, 0, hPad, 0)
        }
        val highlight = View(ctx).apply {
            setBackgroundColor(theme.actionHighlightColor); alpha = 0f
        }
        return FrameLayout(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, hPx)
            isClickable = true; isFocusable = true
            addView(label, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(highlight, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> highlight.animate().alpha(1f).setDuration(80).start()
                    MotionEvent.ACTION_UP -> {
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

    private fun buildScrollView(ctx: Context, layout: ContextMenuLayout, canvas: FrameLayout): ScrollView {
        return object : ScrollView(ctx) {
            override fun onTouchEvent(e: MotionEvent): Boolean =
                if (layout.needsScroll) super.onTouchEvent(e) else false
        }.apply {
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isFillViewport = false
            overScrollMode = View.OVER_SCROLL_NEVER
            setBackgroundColor(Color.TRANSPARENT)
            addView(canvas, ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT))
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
        }
    }

    private fun buildRootOverlay(
        ctx: Context,
        sv: ScrollView,
        layout: ContextMenuLayout,
        snapshotView: View?,
        emojiPanel: View?,
        actionsPanel: View?,
    ): FrameLayout {
        return object : FrameLayout(ctx) {
            override fun onInterceptTouchEvent(e: MotionEvent): Boolean {
                val scrollY = sv.scrollY.toFloat()
                val inEmoji = emojiPanel?.hitTestCanvas(e.x, e.y + scrollY) ?: false
                val inActions = actionsPanel?.hitTestCanvas(e.x, e.y + scrollY) ?: false
                return !(inEmoji || inActions)
            }

            override fun onTouchEvent(e: MotionEvent): Boolean {
                if (e.action == MotionEvent.ACTION_UP && !isDismissing) {
                    val scrollY = sv.scrollY.toFloat()
                    val inSnap = snapshotView?.hitTestCanvas(e.x, e.y + scrollY) ?: false
                    val inEmoji = emojiPanel?.hitTestCanvas(e.x, e.y + scrollY) ?: false
                    val inActions = actionsPanel?.hitTestCanvas(e.x, e.y + scrollY) ?: false
                    if (!inSnap && !inEmoji && !inActions) {
                        runClose(layout, findSnap(this), findEmoji(this), findActions(this))
                    }
                }
                return if (layout.needsScroll) sv.onTouchEvent(e) else true
            }
        }
    }

    private fun prepareOpen(layout: ContextMenuLayout, snap: View?, emoji: View?, actions: View?) {
        currentLayout = layout
        anchorViewRef?.alpha = 0f
        snap?.apply { alpha = 1f; placeAt(layout.snapOrigin) }
        emoji?.apply {
            placeAt(layout.emojiOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = height.toFloat()
            alpha = 0f
        }
        actions?.apply {
            placeAt(layout.actionsOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = 0f
            alpha = 0f
        }
    }

    private fun animateOpen(layout: ContextMenuLayout, backdrop: View, snap: View?, emoji: View?, actions: View?) {
        val openMs = (theme.openDuration * 1000).toLong()

        backdrop.animate().alpha(1f)
            .setDuration((openMs * 0.55).toLong())
            .setInterpolator(DecelerateInterpolator()).start()

        snap?.let { springToRect(it, layout.snapTarget, openMs, 0.82f) }

        actions?.let {
            it.pivotX = it.width / 2f; it.pivotY = 0f
            springPanelOpen(it, layout.actionsTarget, openMs, 0.82f)
        }
        emoji?.let {
            it.pivotX = it.width / 2f; it.pivotY = it.height.toFloat()
            springPanelOpen(it, layout.emojiTarget, openMs, 0.72f)
        }
    }

    private fun runClose(layout: ContextMenuLayout, snap: View?, emoji: View?, actions: View?) {
        if (isDismissing) return
        isDismissing = true

        val root = rootOverlay ?: return
        val backdrop = root.getChildAt(0)
        val closeMs = (theme.closeDuration * 1000).toLong()

        val currentScrollY = scrollView?.scrollY?.toFloat() ?: 0f
        val adjustedSnapOrigin = RectF(layout.snapOrigin.left, layout.snapOrigin.top - currentScrollY, layout.snapOrigin.right, layout.snapOrigin.bottom - currentScrollY)
        val adjustedEmojiOrigin = RectF(layout.emojiOrigin.left, layout.emojiOrigin.top - currentScrollY, layout.emojiOrigin.right, layout.emojiOrigin.bottom - currentScrollY)
        val adjustedActionsOrigin = RectF(layout.actionsOrigin.left, layout.actionsOrigin.top - currentScrollY, layout.actionsOrigin.right, layout.actionsOrigin.bottom - currentScrollY)

        backdrop?.animate()?.alpha(0f)?.setDuration(closeMs)?.start()

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

        snap?.let { springToRect(it, adjustedSnapOrigin, closeMs, 0.9f) }

        root.postDelayed({
            (root.parent as? ViewGroup)?.removeView(root)
            rootOverlay = null
            scrollView = null
            anchorViewRef?.alpha = 1f
            anchorViewRef = null
            onDismiss()
        }, closeMs + 16)
    }

    private fun springToRect(view: View, target: RectF, durationMs: Long, damping: Float) {
        val interp = OvershootInterpolator((1f - damping) * 2f)
        val xA = ObjectAnimator.ofFloat(view, View.X, target.left)
        val yA = ObjectAnimator.ofFloat(view, View.Y, target.top)
        val wA = ValueAnimator.ofInt(view.width, target.width().toInt()).also {
            it.addUpdateListener { a -> view.layoutParams?.width = a.animatedValue as Int; view.requestLayout() }
        }
        val hA = ValueAnimator.ofInt(view.height, target.height().toInt()).also {
            it.addUpdateListener { a -> view.layoutParams?.height = a.animatedValue as Int; view.requestLayout() }
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

    private fun roundedBg(color: Int, cornerDp: Int): GradientDrawable =
        GradientDrawable().apply { setColor(color); cornerRadius = ctx.dp(cornerDp.toFloat()) }

    private fun View.placeAt(r: RectF) {
        x = r.left; y = r.top
        val lp = layoutParams ?: return
        lp.width = r.width().toInt(); lp.height = r.height().toInt(); layoutParams = lp
    }

    private fun View.hitTestCanvas(canvasX: Float, canvasY: Float) =
        canvasX >= x && canvasX <= x + width && canvasY >= y && canvasY <= y + height

    private fun getCanvas(): FrameLayout? =
        (rootOverlay?.getChildAt(1) as? ScrollView)?.getChildAt(0) as? FrameLayout

    private fun findSnap(root: FrameLayout) = getCanvas()?.getChildAt(0)
    private fun findEmoji(root: FrameLayout) = getCanvas()?.let { c -> if (c.childCount > 1) c.getChildAt(1) else null }
    private fun findActions(root: FrameLayout) = getCanvas()?.let { c ->
        when (c.childCount) {
            3 -> c.getChildAt(2)
            2 -> c.getChildAt(1).takeIf { emojis.isEmpty() }
            else -> null
        }
    }

    companion object {
        private const val OPEN_SCALE = 0.5f
        private const val CLOSE_SCALE = 0.5f
    }
}

internal fun Context.dp(dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)

internal fun Context.dpI(dp: Float): Int = dp(dp).toInt()
