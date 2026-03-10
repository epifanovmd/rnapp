package com.rnapp.rnchatview

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.rnapp.rnchatview.ChatLayoutConstants as C

// ─── ContextMenuView ──────────────────────────────────────────────────────────
//
// Полный аналог iOS ContextMenuViewController:
//   • Снапшот исходного view с тенью — анимируется к целевой позиции (spring)
//   • Панель эмодзи сверху снапшота
//   • Панель действий снизу снапшота
//   • Backdrop (затемнение) с fade-in
//   • Позиционирование: ContextMenuLayoutEngine — идентичная логика iOS
//   • Анимация открытия: spring (overshoot), закрытия: decay к origin
//   • Отдельные анимации для панели эмодзи (scale+alpha) и actions (scale+alpha)
//   • Тач на backdrop — закрывает меню
//   • Внутренние тачи по панелям — не закрывают

class ContextMenuView(
    private val ctx: Context,
    private val emojis: List<String>,
    private val actions: List<MessageAction>,
    private val isDark: Boolean,
    private val onEmojiSelected: (String) -> Unit,
    private val onActionSelected: (MessageAction) -> Unit,
    private val onDismiss: () -> Unit,
) {

    private val theme = ContextMenuTheme(isDark)
    private var rootOverlay: FrameLayout? = null
    private var isDismissing = false

    // ─── Show ─────────────────────────────────────────────────────────────

    fun show(anchor: View, messageId: String) {
        dismiss()

        val decorView = anchor.rootView as? ViewGroup ?: return
        val screenW = ctx.resources.displayMetrics.widthPixels.toFloat()
        val screenH = ctx.resources.displayMetrics.heightPixels.toFloat()

        val anchorLoc = IntArray(2)
        anchor.getLocationInWindow(anchorLoc)
        val anchorRect = RectF(
            anchorLoc[0].toFloat(),
            anchorLoc[1].toFloat(),
            (anchorLoc[0] + anchor.width).toFloat(),
            (anchorLoc[1] + anchor.height).toFloat()
        )

        val snapshotView = makeSnapshotView(anchor)
        val emojiPanelView   = if (emojis.isNotEmpty())  makeEmojiPanel()   else null
        val actionsPanelView = if (actions.isNotEmpty()) makeActionsPanel() else null

        val emojiSize   = if (emojiPanelView != null)   measureEmojiPanel(emojis.size)   else SizeF(0f, 0f)
        val actionsSize = if (actionsPanelView != null) measureActionsPanel(actions.size) else SizeF(0f, 0f)

        val layout = ContextMenuLayoutEngine.calculate(
            anchorRect   = anchorRect,
            snapW        = anchor.width.toFloat(),
            snapH        = anchor.height.toFloat(),
            emojiW       = emojiSize.width,
            emojiH       = emojiSize.height,
            actionsW     = actionsSize.width,
            actionsH     = actionsSize.height,
            screenW      = screenW,
            screenH      = screenH,
            hPad         = ctx.dpToPxF(theme.horizontalPadding),
            vPad         = ctx.dpToPxF(theme.verticalPadding),
            emojiGap     = ctx.dpToPxF(theme.emojiPanelSpacing),
            actionsGap   = ctx.dpToPxF(theme.menuSpacing)
        )

        // Root overlay intercepts background taps
        val root = object : FrameLayout(ctx) {
            override fun onTouchEvent(e: MotionEvent): Boolean {
                if (e.action == MotionEvent.ACTION_UP && !isDismissing) {
                    val insideSnap    = snapshotView?.containsTouch(e) ?: false
                    val insideEmoji   = emojiPanelView?.containsTouch(e) ?: false
                    val insideActions = actionsPanelView?.containsTouch(e) ?: false
                    if (!insideSnap && !insideEmoji && !insideActions) {
                        runClose(root = this, layout = layout, snapshot = snapshotView,
                            emojiPanel = emojiPanelView, actionsPanel = actionsPanelView)
                    }
                }
                return true
            }
        }
        rootOverlay = root

        val backdropDim = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            setBackgroundColor(theme.backdropColor)
            alpha = 0f
        }
        root.addView(backdropDim)

        snapshotView?.let   { root.addView(it, FrameLayout.LayoutParams(anchor.width, anchor.height)) }
        emojiPanelView?.let {
            val lp = FrameLayout.LayoutParams(emojiSize.width.toInt(), emojiSize.height.toInt())
            root.addView(it, lp)
        }
        actionsPanelView?.let {
            val lp = FrameLayout.LayoutParams(actionsSize.width.toInt(), actionsSize.height.toInt())
            root.addView(it, lp)
        }

        decorView.addView(root, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))

        // Pre-position at origin
        prepareOpen(layout, snapshotView, emojiPanelView, actionsPanelView)

        root.post {
            animateOpen(layout, backdropDim, snapshotView, emojiPanelView, actionsPanelView)
        }
    }

    // ─── Dismiss (immediate, no animation) ───────────────────────────────

    fun dismiss() {
        val root = rootOverlay ?: return
        try { (root.parent as? ViewGroup)?.removeView(root) } catch (_: Exception) {}
        rootOverlay = null
        isDismissing = false
    }

    // ─── Snapshot ─────────────────────────────────────────────────────────

    private fun makeSnapshotView(source: View): View? {
        if (source.width <= 0 || source.height <= 0) return null
        val bmp = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
        source.draw(Canvas(bmp))

        val cornerRadiusPx = ctx.dpToPxF(C.BUBBLE_CORNER_RADIUS_DP)
        val iv = object : ImageView(ctx) {
            private val clipPath = Path()
            private val clipRectF = RectF()
            override fun onSizeChanged(w: Int, h: Int, ow: Int, oh: Int) {
                super.onSizeChanged(w, h, ow, oh)
                clipRectF.set(0f, 0f, w.toFloat(), h.toFloat())
                clipPath.reset()
                clipPath.addRoundRect(clipRectF, cornerRadiusPx, cornerRadiusPx, Path.Direction.CW)
            }
            override fun onDraw(canvas: Canvas) {
                canvas.save(); canvas.clipPath(clipPath); super.onDraw(canvas); canvas.restore()
            }
        }
        iv.setImageBitmap(bmp)
        iv.scaleType = ImageView.ScaleType.FIT_XY

        val wrapper = FrameLayout(ctx).apply { elevation = ctx.dpToPxF(6f) }
        wrapper.addView(iv, FrameLayout.LayoutParams(source.width, source.height))
        return wrapper
    }

    // ─── Emoji panel ──────────────────────────────────────────────────────

    private fun makeEmojiPanel(): LinearLayout {
        val padPx = ctx.dpToPx(10f)
        return LinearLayout(ctx).apply {
            orientation  = LinearLayout.HORIZONTAL
            gravity      = Gravity.CENTER_VERTICAL
            setPadding(padPx, ctx.dpToPx(6f), padPx, ctx.dpToPx(6f))
            background   = roundedBackground(theme.emojiPanelBackground, theme.emojiPanelCornerRadius.toFloat())
            elevation    = ctx.dpToPxF(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline   = true
            emojis.forEach { emoji -> addView(makeEmojiButton(emoji)) }
        }
    }

    private fun makeEmojiButton(emoji: String): TextView {
        val sizePx = ctx.dpToPx(theme.emojiItemSize.toFloat())
        return TextView(ctx).apply {
            text     = emoji
            setTextSize(TypedValue.COMPLEX_UNIT_SP, theme.emojiFontSize)
            gravity  = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(sizePx, sizePx)
            isClickable = true; isFocusable = true
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN ->
                        v.animate().scaleX(0.75f).scaleY(0.75f).setDuration(100).start()
                    MotionEvent.ACTION_UP -> {
                        v.animate().scaleX(1f).scaleY(1f)
                            .setDuration(200).setInterpolator(OvershootInterpolator(0.8f)).start()
                        onEmojiSelected(emoji)
                        val root = rootOverlay
                        if (root != null) runClose(root, null, null, null, null)
                    }
                    MotionEvent.ACTION_CANCEL ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(150).start()
                }
                true
            }
        }
    }

    private fun measureEmojiPanel(count: Int): SizeF {
        val itemPx  = ctx.dpToPxF(theme.emojiItemSize.toFloat())
        val padPx   = ctx.dpToPxF(10f) * 2
        val vPadPx  = ctx.dpToPxF(12f)
        return SizeF(count * itemPx + padPx, itemPx + vPadPx)
    }

    // ─── Actions panel ────────────────────────────────────────────────────

    private fun makeActionsPanel(): LinearLayout {
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background  = roundedBackground(theme.menuBackground, theme.menuCornerRadius.toFloat())
            elevation   = ctx.dpToPxF(8f)
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
            clipToOutline   = true
            for ((idx, action) in actions.withIndex()) {
                addView(makeActionRow(action))
                if (idx < actions.size - 1) addView(makeSeparator())
            }
        }
    }

    private fun makeActionRow(action: MessageAction): FrameLayout {
        val hPad  = ctx.dpToPx(theme.actionHorizontalPadding.toFloat())
        val hPx   = ctx.dpToPx(theme.actionItemHeight.toFloat())
        val color = if (action.isDestructive) theme.actionDestructiveColor else theme.actionTitleColor

        val label = TextView(ctx).apply {
            text      = action.title
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTextColor(color)
            gravity   = Gravity.CENTER_VERTICAL
            setPadding(hPad, 0, hPad, 0)
        }
        val highlight = View(ctx).apply {
            setBackgroundColor(theme.actionHighlightColor); alpha = 0f
        }
        return FrameLayout(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, hPx)
            isClickable  = true; isFocusable = true
            addView(label,    FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(highlight, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN  -> highlight.animate().alpha(1f).setDuration(80).start()
                    MotionEvent.ACTION_UP    -> {
                        highlight.animate().alpha(0f).setDuration(180).start()
                        onActionSelected(action)
                        val root = rootOverlay
                        if (root != null) runClose(root, null, null, null, null)
                    }
                    MotionEvent.ACTION_CANCEL -> highlight.animate().alpha(0f).setDuration(180).start()
                }
                true
            }
        }
    }

    private fun makeSeparator(): View = View(ctx).apply {
        layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, 1).apply {
            marginStart = ctx.dpToPx(16f); marginEnd = ctx.dpToPx(16f)
        }
        setBackgroundColor(theme.separatorColor)
    }

    private fun measureActionsPanel(count: Int): SizeF {
        val itemH = ctx.dpToPxF(theme.actionItemHeight.toFloat())
        val sepH  = 1f
        val total = count * itemH + maxOf(0, count - 1) * sepH
        return SizeF(ctx.dpToPxF(theme.menuWidth.toFloat()), total)
    }

    // ─── Pre-open positioning ─────────────────────────────────────────────

    private fun prepareOpen(layout: ContextMenuLayout, snapshot: View?, emoji: View?, actions: View?) {
        snapshot?.placeAt(layout.snapOrigin)
        emoji?.apply   { placeAt(layout.emojiOrigin);   scaleX = OPEN_SCALE; scaleY = OPEN_SCALE; alpha = 0f }
        actions?.apply { placeAt(layout.actionsOrigin); scaleX = OPEN_SCALE; scaleY = OPEN_SCALE; alpha = 0f }
    }

    // ─── Open animation ───────────────────────────────────────────────────

    private fun animateOpen(layout: ContextMenuLayout, backdrop: View, snapshot: View?, emoji: View?, actions: View?) {
        val openMs = (theme.openDuration * 1000).toLong()

        backdrop.animate().alpha(1f).setDuration((openMs * 0.55).toLong())
            .setInterpolator(DecelerateInterpolator()).start()

        snapshot?.springToRect(layout.snapTarget, openMs, damping = 0.82f)

        actions?.apply {
            pivotX = width / 2f; pivotY = 0f
            springPanelOpen(layout.actionsTarget, openMs, damping = 0.82f)
        }
        emoji?.apply {
            pivotX = width / 2f; pivotY = height.toFloat()
            springPanelOpen(layout.emojiTarget, openMs, damping = 0.72f)
        }
    }

    // ─── Close animation ──────────────────────────────────────────────────

    private fun runClose(
        root: FrameLayout,
        layout: ContextMenuLayout?,
        snapshot: View?,
        emojiPanel: View?,
        actionsPanel: View?,
    ) {
        if (isDismissing) return
        isDismissing = true

        val closeMs = (theme.closeDuration * 1000).toLong()
        val backdrop = root.getChildAt(0)

        backdrop?.animate()?.alpha(0f)?.setDuration(closeMs)?.start()

        listOfNotNull(snapshot, emojiPanel, actionsPanel).forEach { v ->
            v.animate().scaleX(CLOSE_SCALE).scaleY(CLOSE_SCALE).alpha(0f)
                .setDuration(closeMs).setInterpolator(DecelerateInterpolator()).start()
        }

        root.postDelayed({
            (root.parent as? ViewGroup)?.removeView(root)
            rootOverlay = null
            onDismiss()
        }, closeMs + 50)
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private fun roundedBackground(color: Int, cornerDp: Float): GradientDrawable =
        GradientDrawable().apply { setColor(color); cornerRadius = ctx.dpToPxF(cornerDp) }

    private fun View.placeAt(rect: RectF) {
        x = rect.left; y = rect.top
        val lp = layoutParams ?: return
        lp.width = rect.width().toInt(); lp.height = rect.height().toInt()
        layoutParams = lp
    }

    private fun View.containsTouch(e: MotionEvent) =
        e.rawX >= x && e.rawX <= x + width && e.rawY >= y && e.rawY <= y + height

    private fun View.springToRect(target: RectF, durationMs: Long, damping: Float) {
        val interp = OvershootInterpolator((1f - damping) * 2f)
        val xA = ObjectAnimator.ofFloat(this, View.X, target.left)
        val yA = ObjectAnimator.ofFloat(this, View.Y, target.top)
        val wA = ValueAnimator.ofInt(width, target.width().toInt()).also {
            it.addUpdateListener { a -> layoutParams?.width = a.animatedValue as Int; requestLayout() }
        }
        val hA = ValueAnimator.ofInt(height, target.height().toInt()).also {
            it.addUpdateListener { a -> layoutParams?.height = a.animatedValue as Int; requestLayout() }
        }
        AnimatorSet().apply { playTogether(xA, yA, wA, hA); duration = durationMs; interpolator = interp; start() }
    }

    private fun View.springPanelOpen(target: RectF, durationMs: Long, damping: Float) {
        val interp = OvershootInterpolator((1f - damping) * 3f)
        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(this@springPanelOpen, View.X, target.left),
                ObjectAnimator.ofFloat(this@springPanelOpen, View.Y, target.top),
                ObjectAnimator.ofFloat(this@springPanelOpen, View.SCALE_X, 1f),
                ObjectAnimator.ofFloat(this@springPanelOpen, View.SCALE_Y, 1f),
                ObjectAnimator.ofFloat(this@springPanelOpen, View.ALPHA, 1f),
            )
            duration = durationMs; interpolator = interp; start()
        }
    }

    companion object {
        private const val OPEN_SCALE  = 0.5f
        private const val CLOSE_SCALE = 0.5f
        private val MATCH_PARENT = ViewGroup.LayoutParams.MATCH_PARENT
    }
}

// ─── ContextMenuLayoutEngine ──────────────────────────────────────────────────

data class SizeF(val width: Float, val height: Float)

data class ContextMenuLayout(
    val snapTarget:    RectF,
    val emojiTarget:   RectF,
    val actionsTarget: RectF,
    val snapOrigin:    RectF,
    val emojiOrigin:   RectF,
    val actionsOrigin: RectF,
    val needsScroll:   Boolean,
    val scrollOffset:  Float,
    val hasEmoji:      Boolean,
    val hasActions:    Boolean,
)

object ContextMenuLayoutEngine {

    fun calculate(
        anchorRect: RectF,
        snapW: Float, snapH: Float,
        emojiW: Float, emojiH: Float,
        actionsW: Float, actionsH: Float,
        screenW: Float, screenH: Float,
        hPad: Float, vPad: Float,
        emojiGap: Float, actionsGap: Float,
    ): ContextMenuLayout {
        val hasEmoji   = emojiH   > 0
        val hasActions = actionsH > 0
        val eGap = if (hasEmoji)   emojiGap   else 0f
        val mGap = if (hasActions) actionsGap else 0f

        val topLimit    = vPad
        val bottomLimit = screenH - vPad

        val snapX  = clamp(anchorRect.left, hPad, screenW - snapW - hPad)
        val emojiX = if (hasEmoji)   clamp(snapX + snapW - emojiW, hPad, screenW - emojiW - hPad)   else 0f
        val menuX  = if (hasActions) (if (snapX + actionsW > screenW - hPad) screenW - hPad - actionsW else snapX) else 0f

        val totalH      = emojiH + eGap + snapH + mGap + actionsH
        val needsScroll = totalH > bottomLimit - topLimit

        val emojiY: Float; val snapY: Float; val menuY: Float; val scrollOffset: Float

        if (needsScroll) {
            emojiY       = topLimit
            snapY        = emojiY + emojiH + eGap
            menuY        = snapY  + snapH  + mGap
            scrollOffset = maxOf(0f, menuY + actionsH + vPad - screenH)
        } else {
            val blockTop = clamp(anchorRect.top - emojiH - eGap, topLimit, bottomLimit - totalH)
            emojiY       = blockTop
            snapY        = emojiY + emojiH + eGap
            menuY        = snapY  + snapH  + mGap
            scrollOffset = 0f
        }

        val originY = anchorRect.top + scrollOffset

        return ContextMenuLayout(
            snapTarget    = RectF(snapX,  snapY,  snapX  + snapW,    snapY  + snapH),
            emojiTarget   = if (hasEmoji)   RectF(emojiX, emojiY,    emojiX + emojiW,    emojiY + emojiH)    else RectF(),
            actionsTarget = if (hasActions) RectF(menuX,  menuY,     menuX  + actionsW,  menuY  + actionsH)  else RectF(),
            snapOrigin    = RectF(anchorRect.left, originY, anchorRect.left + snapW, originY + snapH),
            emojiOrigin   = if (hasEmoji)   RectF(emojiX, originY - eGap - emojiH, emojiX + emojiW, originY - eGap)       else RectF(),
            actionsOrigin = if (hasActions) RectF(menuX,  originY + snapH + mGap,  menuX  + actionsW, originY + snapH + mGap + actionsH) else RectF(),
            needsScroll   = needsScroll,
            scrollOffset  = scrollOffset,
            hasEmoji      = hasEmoji,
            hasActions    = hasActions,
        )
    }

    private fun clamp(v: Float, lo: Float, hi: Float) = maxOf(lo, minOf(v, hi))
}

// ─── ContextMenuTheme ─────────────────────────────────────────────────────────

class ContextMenuTheme(isDark: Boolean) {
    val backdropColor: Int             = if (isDark) Color.argb(128, 0, 0, 0) else Color.argb(77, 0, 0, 0)
    val emojiPanelBackground: Int      = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val emojiPanelCornerRadius: Int    = 16
    val emojiFontSize: Float           = 20f
    val emojiItemSize: Int             = 36
    val menuBackground: Int            = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val menuCornerRadius: Int          = 12
    val separatorColor: Int            = if (isDark) Color.argb(31, 255, 255, 255) else Color.argb(31, 0, 0, 0)
    val actionTitleColor: Int          = if (isDark) Color.rgb(235, 235, 235) else Color.BLACK
    val actionDestructiveColor: Int    = Color.rgb(255, 59, 48)
    val actionHighlightColor: Int      = if (isDark) Color.argb(60, 255, 255, 255) else Color.argb(30, 0, 0, 0)
    val actionItemHeight: Int          = 48
    val actionHorizontalPadding: Int   = 14
    val openDuration: Double           = 0.40
    val closeDuration: Double          = 0.26
    val emojiPanelSpacing: Float       = 6f
    val menuSpacing: Float             = 6f
    val horizontalPadding: Float       = 12f
    val verticalPadding: Float         = 10f
    val menuWidth: Int                 = 220
}

// ─── Context extensions ───────────────────────────────────────────────────────

private fun Context.dpToPxF(dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)
