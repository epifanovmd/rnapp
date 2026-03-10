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
    private var isDismissing = false
    private var anchorViewRef: View? = null   // держим ссылку чтобы вернуть alpha

    // ─── Show ─────────────────────────────────────────────────────────────

    fun show(anchor: View, messageId: String) {
        dismiss()
        isDismissing = false
        anchorViewRef = anchor

        val decorView = anchor.rootView as? ViewGroup ?: return
        val dm = ctx.resources.displayMetrics
        val screenW = dm.widthPixels.toFloat()
        val screenH = dm.heightPixels.toFloat()

        // Позиция anchor в window-координатах
        val anchorLoc = IntArray(2)
        anchor.getLocationInWindow(anchorLoc)
        val anchorRect = RectF(
            anchorLoc[0].toFloat(),
            anchorLoc[1].toFloat(),
            (anchorLoc[0] + anchor.width).toFloat(),
            (anchorLoc[1] + anchor.height).toFloat()
        )

        // Построение панелей
        val snapshotView = makeSnapshotView(anchor)
        val emojiPanel   = if (emojis.isNotEmpty())  makeEmojiPanel()   else null
        val actionsPanel = if (actions.isNotEmpty()) makeActionsPanel() else null

        val emojiSz   = if (emojiPanel != null)   measureEmojiPanel(emojis.size)   else SizePair(0f, 0f)
        val actionsSz = if (actionsPanel != null) measureActionsPanel(actions.size) else SizePair(0f, 0f)

        val layout = ContextMenuLayoutEngine.calculate(
            anchorRect = anchorRect,
            snapW      = anchor.width.toFloat(),
            snapH      = anchor.height.toFloat(),
            emojiW     = emojiSz.w, emojiH = emojiSz.h,
            actionsW   = actionsSz.w, actionsH = actionsSz.h,
            screenW    = screenW, screenH = screenH,
            hPad       = ctx.dp(theme.horizontalPadding),
            vPad       = ctx.dp(theme.verticalPadding),
            emojiGap   = ctx.dp(theme.emojiPanelSpacing),
            actionsGap = ctx.dp(theme.menuSpacing)
        )

        // Root overlay — intercepts backdrop taps
        val root = object : FrameLayout(ctx) {
            override fun onTouchEvent(e: MotionEvent): Boolean {
                if (e.action == MotionEvent.ACTION_UP && !isDismissing) {
                    val inSnap    = snapshotView?.hitTest(e) ?: false
                    val inEmoji   = emojiPanel?.hitTest(e)  ?: false
                    val inActions = actionsPanel?.hitTest(e) ?: false
                    if (!inSnap && !inEmoji && !inActions) {
                        runClose(layout, snapshotView, emojiPanel, actionsPanel)
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

        snapshotView?.let { root.addView(it, FrameLayout.LayoutParams(anchor.width, anchor.height)) }
        emojiPanel?.let   { root.addView(it, FrameLayout.LayoutParams(emojiSz.w.toInt(), emojiSz.h.toInt())) }
        actionsPanel?.let { root.addView(it, FrameLayout.LayoutParams(actionsSz.w.toInt(), actionsSz.h.toInt())) }

        decorView.addView(root, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))

        // Скрываем оригинальный anchor (эффект "сообщение переместилось")
        anchor.alpha = 0f

        // Расставляем по начальным позициям (origin)
        prepareOpen(layout, snapshotView, emojiPanel, actionsPanel)

        root.post {
            animateOpen(layout, backdropDim, snapshotView, emojiPanel, actionsPanel)
        }
    }

    // ─── Dismiss (без анимации — для external forced dismiss) ─────────────

    fun dismiss() {
        val root = rootOverlay ?: return
        anchorViewRef?.alpha = 1f
        anchorViewRef = null
        try { (root.parent as? ViewGroup)?.removeView(root) } catch (_: Exception) {}
        rootOverlay = null
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
            override fun onDraw(c: Canvas) {
                c.save(); c.clipPath(clipPath); super.onDraw(c); c.restore()
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
        snap?.placeAt(layout.snapOrigin)
        // Emoji появляется из зоны над снапшотом → стартует сжатым оттуда
        emoji?.apply {
            placeAt(layout.emojiOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = height.toFloat()  // масштабируем от низа (к снапу)
            alpha  = 0f
        }
        // Actions появляется из зоны под снапшотом → стартует сжатым оттуда
        actions?.apply {
            placeAt(layout.actionsOrigin)
            scaleX = OPEN_SCALE; scaleY = OPEN_SCALE
            pivotX = width / 2f; pivotY = 0f               // масштабируем от верха (к снапу)
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

        // 1. Backdrop fade-out
        backdrop?.animate()?.alpha(0f)?.setDuration(closeMs)?.start()

        // 2. Emoji схлопывается вниз к снапшоту (обратно от emojiTarget к emojiOrigin)
        emoji?.let {
            it.pivotX = it.width / 2f; it.pivotY = it.height.toFloat()
            AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(it, View.X, layout.emojiOrigin.left),
                    ObjectAnimator.ofFloat(it, View.Y, layout.emojiOrigin.top),
                    ObjectAnimator.ofFloat(it, View.SCALE_X, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.SCALE_Y, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.ALPHA, 0f),
                )
                duration = closeMs; interpolator = DecelerateInterpolator(); start()
            }
        }

        // 3. Actions схлопывается вверх к снапшоту (обратно от actionsTarget к actionsOrigin)
        actions?.let {
            it.pivotX = it.width / 2f; it.pivotY = 0f
            AnimatorSet().apply {
                playTogether(
                    ObjectAnimator.ofFloat(it, View.X, layout.actionsOrigin.left),
                    ObjectAnimator.ofFloat(it, View.Y, layout.actionsOrigin.top),
                    ObjectAnimator.ofFloat(it, View.SCALE_X, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.SCALE_Y, CLOSE_SCALE),
                    ObjectAnimator.ofFloat(it, View.ALPHA, 0f),
                )
                duration = closeMs; interpolator = DecelerateInterpolator(); start()
            }
        }

        // 4. Снапшот возвращается на место оригинала
        snap?.let { springToRect(it, layout.snapOrigin, closeMs, 0.9f) }

        // 5. По завершении: убираем overlay, восстанавливаем оригинал
        root.postDelayed({
            (root.parent as? ViewGroup)?.removeView(root)
            rootOverlay = null
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

    private fun View.hitTest(e: MotionEvent) =
        e.rawX >= x && e.rawX <= x + width && e.rawY >= y && e.rawY <= y + height

    // Tag-based finders — overlay child order: 0=backdrop, 1=snap, 2=emoji, 3=actions
    private fun findSnap(root: FrameLayout)    = root.getChildAt(1)
    private fun findEmoji(root: FrameLayout)   = if (root.childCount > 2) root.getChildAt(2) else null
    private fun findActions(root: FrameLayout) = when (root.childCount) {
        4 -> root.getChildAt(3)
        3 -> root.getChildAt(2).takeIf { emojis.isEmpty() }
        else -> null
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

        // isMine bubbles are right-aligned → anchor snapshot at right, panels align right
        // !isMine bubbles are left-aligned  → anchor snapshot at left,  panels align left
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

        val totalH = emojiH + eGap + snapH + mGap + actionsH

        // Позиция блока: стараемся разместить так чтобы снапшот был там где был anchor
        val blockTop = clamp(anchorRect.top - emojiH - eGap, topLimit, bottomLimit - totalH)
        val emojiY   = blockTop
        val snapY    = emojiY + emojiH + eGap
        val menuY    = snapY  + snapH  + mGap

        // Origin = там где сейчас anchor (до анимации)
        val originY = anchorRect.top

        return ContextMenuLayout(
            snapTarget    = RectF(snapX,  snapY,  snapX  + snapW,   snapY  + snapH),
            emojiTarget   = if (hasEmoji)   RectF(emojiX, emojiY,   emojiX + emojiW, emojiY + emojiH) else RectF(),
            actionsTarget = if (hasActions) RectF(menuX,  menuY,    menuX  + actionsW, menuY + actionsH) else RectF(),
            snapOrigin    = RectF(anchorRect.left, originY, anchorRect.left + snapW, originY + snapH),
            emojiOrigin   = if (hasEmoji)   RectF(emojiX, originY - eGap - emojiH, emojiX + emojiW, originY - eGap) else RectF(),
            actionsOrigin = if (hasActions) RectF(menuX,  originY + snapH + mGap, menuX + actionsW, originY + snapH + mGap + actionsH) else RectF(),
            hasEmoji      = hasEmoji,
            hasActions    = hasActions,
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
