package com.rnapp.contextmenu

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.graphics.*
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import android.view.*
import android.view.animation.DecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.*
import androidx.annotation.RequiresApi
import androidx.core.view.isVisible
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ContextMenuTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF

/**
 * Контекстное меню — точное зеркало iOS ContextMenuViewController.swift +
 * ContextMenuAnimator.swift + ContextMenuLayoutEngine.swift.
 *
 * Архитектура анимации:
 *
 *  iOS делает так:
 *   1. sourceView.alpha = 0  (оригинальное сообщение скрывается)
 *   2. snapshot создаётся НА МЕСТЕ sourceView (snapOrigin = sourceFrame)
 *   3. snapshot анимируется к snapTarget (spring)
 *   4. emojiPanel появляется из emojiOrigin → emojiTarget (scale+fade, spring)
 *   5. actionsPanel появляется из actionsOrigin → actionsTarget (scale+fade, spring)
 *   6. backdrop fade 0→1
 *   При закрытии: snapshot возвращается к sourceFrame, sourceView.alpha = 1
 *
 *  Android (этот файл):
 *   1. anchorView.alpha = 0  (скрываем оригинал)
 *   2. snapshotView стартует в позиции anchorView (anchorLeft, anchorTop)
 *   3. ValueAnimator двигает snapshot к targetTop (если нужен сдвиг)
 *   4. emojiPanel: scale 0.5→1 + fade 0→1, pivot = угол ближайший к anchor
 *   5. actionMenu: scale 0.5→1 + fade 0→1, pivot = угол ближайший к anchor
 *   6. backdrop: alpha 0→1 (быстрее остального — как iOS 55% от openDuration)
 *   При закрытии: snapshot возвращается к anchorTop, anchorView.alpha = 1
 *
 *  Позиционирование зеркалит ContextMenuLayoutEngine.swift:
 *   • needsScroll = totalH > доступная высота
 *   • если не нужен скролл: snapshot пытается остаться на месте anchor,
 *     сдвигается только если не помещается (emoji сверху / actions снизу)
 *   • если нужен скролл: всё выкладывается сверху вниз
 *
 *  Blur: сильнее, чем в предыдущей версии (radius * 1.5, scale 0.3)
 */
class ContextMenuOverlay private constructor(
    private val context: Context,
    private val theme: ContextMenuTheme,
) {

    interface Listener {
        fun onEmojiSelected(emoji: String)
        fun onActionSelected(actionId: String)
        fun onDismiss()
    }

    private var listener: Listener? = null
    // FIX #2: Используем WindowManager для отображения поверх всего
    private var windowManagerRef: android.view.WindowManager? = null
    private var decorView: ViewGroup? = null  // fallback если WM недоступен
    private var overlayRoot: FrameLayout? = null

    // Элементы overlay
    private var backdropView: View? = null
    private var snapshotView: ImageView? = null
    private var emojiPanelView: View? = null
    private var actionMenuView: View? = null

    // Запоминаем для анимации закрытия
    private var anchorViewRef: View? = null
    private var snapshotStartTop: Int = 0   // исходная Y-позиция (место anchor)
    private var snapshotTargetTop: Int = 0  // целевая Y-позиция

    fun show(
        activity: Activity,
        anchorView: View,
        messageBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        anchorGravity: AnchorGravity,
        listener: Listener,
    ) {
        this.listener      = listener
        this.anchorViewRef = anchorView

        val loc = IntArray(2).also { anchorView.getLocationOnScreen(it) }
        val anchorLeft   = loc[0]
        val anchorTop    = loc[1]
        val anchorWidth  = anchorView.width
        val anchorHeight = anchorView.height

        // Снимок экрана ДО того как скроем anchor
        val screenshotBitmap = captureScreen(activity)
        val blurredBitmap    = blurBitmap(screenshotBitmap)
        screenshotBitmap.recycle()

        // FIX #3: Скрываем оригинал ДО рендера overlay — без мигания
        anchorView.alpha = 0f

        val overlay = buildOverlay(
            blurredBitmap, messageBitmap, emojis, actions, anchorGravity,
            anchorLeft, anchorTop, anchorWidth, anchorHeight,
        )
        this.overlayRoot = overlay

        // FIX #2: Добавляем через WindowManager — поверх ВСЕГО включая InputBar,
        // навигационную панель и статус-бар. TYPE_APPLICATION_OVERLAY требует
        // SYSTEM_ALERT_WINDOW разрешения только на API 26+. Как fallback —
        // TYPE_APPLICATION (всегда работает внутри Activity window).
        try {
            val wm = activity.windowManager
            val params = android.view.WindowManager.LayoutParams(
                android.view.WindowManager.LayoutParams.MATCH_PARENT,
                android.view.WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    android.view.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION")
                    android.view.WindowManager.LayoutParams.TYPE_APPLICATION,
                android.view.WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    android.view.WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    android.view.WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                android.graphics.PixelFormat.TRANSLUCENT,
            ).apply {
                gravity = android.view.Gravity.TOP or android.view.Gravity.START
            }
            wm.addView(overlay, params)
            windowManagerRef = wm
            decorView = null
        } catch (e: Exception) {
            // Fallback: добавляем в decorView (работает без SYSTEM_ALERT_WINDOW)
            val dv = activity.window.decorView as ViewGroup
            dv.addView(overlay)
            decorView = dv
            windowManagerRef = null
        }

        // FIX #3: snapshot стартует ровно с позиции anchor — без задержки
        overlay.post { animateIn() }
    }

    fun dismiss() {
        val overlay = overlayRoot ?: return
        animateOut {
            try {
                windowManagerRef?.removeView(overlay)
                    ?: decorView?.removeView(overlay)
            } catch (_: Exception) {}
            overlayRoot    = null
            windowManagerRef = null
            decorView      = null
            anchorViewRef?.alpha = 1f  // восстанавливаем видимость оригинала
            anchorViewRef  = null
            listener?.onDismiss()
            listener = null
        }
    }

    // ─── Build overlay ────────────────────────────────────────────────────────

    private fun buildOverlay(
        blurredBitmap: Bitmap,
        msgBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        gravity: AnchorGravity,
        anchorLeft: Int,
        anchorTop: Int,
        anchorWidth: Int,
        anchorHeight: Int,
    ): FrameLayout {
        fun dp(v: Float): Int = v.dpToPx(context)

        val screenW = context.resources.displayMetrics.widthPixels
        val screenH = context.resources.displayMetrics.heightPixels

        val vMargin  = dp(theme.verticalPaddingDp.toFloat())
        val hMargin  = dp(theme.horizontalPaddingDp.toFloat())
        val menuGap  = dp(theme.menuSpacingDp.toFloat())
        val emojiGap = dp(theme.emojiPanelSpacingDp.toFloat())

        // ── Root ──────────────────────────────────────────────────────────────
        val root = FrameLayout(context).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            isClickable = true
            setOnClickListener { dismiss() }
        }

        // ── Backdrop ──────────────────────────────────────────────────────────
        val backdrop = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setImageBitmap(blurredBitmap)
            scaleType  = ImageView.ScaleType.FIT_XY
            foreground = ColorDrawable(theme.backdropColor)
            alpha      = 0f
        }
        backdropView = backdrop
        root.addView(backdrop)

        // ── Панели — измеряем для расчёта layout ──────────────────────────────
        val emojiPanel = if (emojis.isNotEmpty()) buildEmojiPanel(emojis) else null
        emojiPanelView = emojiPanel

        val actionMenu = if (actions.isNotEmpty()) buildActionMenu(actions, gravity) else null
        actionMenuView = actionMenu

        fun measureWidth(v: View?, maxW: Int): Int {
            if (v == null) return 0
            v.measure(View.MeasureSpec.makeMeasureSpec(maxW, View.MeasureSpec.AT_MOST),
                      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED))
            return v.measuredWidth
        }
        fun measureHeight(v: View?, maxW: Int): Int {
            if (v == null) return 0
            v.measure(View.MeasureSpec.makeMeasureSpec(maxW, View.MeasureSpec.AT_MOST),
                      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED))
            return v.measuredHeight
        }

        val maxContentW = screenW - hMargin * 2

        val emojiW = measureWidth(emojiPanel, maxContentW)
        val emojiH = measureHeight(emojiPanel, maxContentW)
        val menuW  = measureWidth(actionMenu, maxContentW)
        val menuH  = measureHeight(actionMenu, maxContentW)
        val snapW  = msgBitmap.width
        val snapH  = msgBitmap.height

        val hasEmoji   = emojiPanel != null && emojiH > 0
        val hasActions = actionMenu != null && menuH > 0

        val eGap = if (hasEmoji)   emojiGap else 0
        val mGap = if (hasActions) menuGap  else 0

        // ── Layout engine (зеркало ContextMenuLayoutEngine.swift) ──────────────

        val topLimit    = vMargin
        val bottomLimit = screenH - vMargin

        val totalH    = (if (hasEmoji) emojiH + eGap else 0) + snapH + (if (hasActions) mGap + menuH else 0)
        val needsScroll = totalH > bottomLimit - topLimit

        // X-позиции
        val snapX  = anchorLeft.coerceIn(hMargin, screenW - snapW - hMargin)
        val emojiX = if (hasEmoji) {
            when (gravity) {
                AnchorGravity.END   -> (snapX + snapW - emojiW).coerceIn(hMargin, screenW - emojiW - hMargin)
                AnchorGravity.START -> snapX.coerceIn(hMargin, screenW - emojiW - hMargin)
            }
        } else 0
        val menuX = if (hasActions) {
            when (gravity) {
                AnchorGravity.END   -> (snapX + snapW - menuW).coerceIn(hMargin, screenW - menuW - hMargin)
                AnchorGravity.START -> snapX.coerceIn(hMargin, screenW - menuW - hMargin)
            }
        } else 0

        // Y-позиции (целевые, после анимации)
        val snapTargetTop: Int
        val emojiTargetTop: Int
        val menuTargetTop: Int

        if (needsScroll) {
            // Как в iOS needsScroll ветке: раскладываем сверху
            emojiTargetTop = topLimit
            snapTargetTop  = emojiTargetTop + (if (hasEmoji) emojiH + eGap else 0)
            menuTargetTop  = snapTargetTop + snapH + mGap
        } else {
            // Пытаемся сохранить snapshot на месте anchor (зеркало iOS "blockTop")
            val emojiAbove = if (hasEmoji) emojiH + eGap else 0
            val menuBelow  = if (hasActions) mGap + menuH else 0
            val idealSnapTop = anchorTop
            // Сдвигаем вниз если emoji вылазит выше topLimit
            val minSnapTop = topLimit + emojiAbove
            // Сдвигаем вверх если actions вылазят ниже bottomLimit
            val maxSnapTop = bottomLimit - snapH - menuBelow
            snapTargetTop  = idealSnapTop.coerceIn(minSnapTop, maxSnapTop)
            emojiTargetTop = snapTargetTop - eGap - emojiH
            menuTargetTop  = snapTargetTop + snapH + mGap
        }

        // Начальная Y-позиция snapshot = место anchor (как iOS snapOrigin = sourceFrame)
        snapshotStartTop  = anchorTop
        snapshotTargetTop = snapTargetTop

        // ── Добавляем элементы в overlay ──────────────────────────────────────

        // Emoji panel — начальное состояние: у anchor, скрыта
        if (emojiPanel != null && hasEmoji) {
            root.addView(emojiPanel, FrameLayout.LayoutParams(emojiW, emojiH).apply {
                leftMargin = emojiX
                topMargin  = snapshotStartTop - eGap - emojiH  // стартовая позиция рядом с anchor
            })
            emojiPanel.alpha  = 0f
            emojiPanel.scaleX = 0.5f; emojiPanel.scaleY = 0.5f
            emojiPanel.pivotX = when (gravity) {
                AnchorGravity.END   -> emojiW.toFloat()
                AnchorGravity.START -> 0f
            }
            emojiPanel.pivotY = emojiH.toFloat()
        }

        // Snapshot — стартует на месте anchor
        val msgView = ImageView(context).apply {
            setImageBitmap(msgBitmap)
            scaleType = ImageView.ScaleType.FIT_START
            elevation = ChatLayoutConstants.BUBBLE_SHADOW_RADIUS_DP.dpToPxF(context)
        }
        snapshotView = msgView
        root.addView(msgView, FrameLayout.LayoutParams(snapW, snapH).apply {
            leftMargin = snapX
            topMargin  = snapshotStartTop  // старт = позиция anchor
        })
        msgView.alpha = 0f  // сначала скрыт (появляется вместе с backdrop)

        // Action menu — начальное состояние: у anchor, скрыто
        if (actionMenu != null && hasActions) {
            root.addView(actionMenu, FrameLayout.LayoutParams(menuW, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                leftMargin = menuX
                topMargin  = snapshotStartTop + snapH + mGap  // стартовая позиция рядом с anchor
            })
            actionMenu.alpha  = 0f
            actionMenu.scaleX = 0.5f; actionMenu.scaleY = 0.5f
            actionMenu.pivotX = when (gravity) {
                AnchorGravity.END   -> menuW.toFloat()
                AnchorGravity.START -> 0f
            }
            actionMenu.pivotY = 0f
        }

        return root
    }

    // ─── Animation (зеркало ContextMenuAnimator.swift) ────────────────────────

    private fun animateIn() {
        val openDur = theme.openDurationMs

        // 1. Backdrop fade — быстрее остального (55% от openDuration, как iOS)
        backdropView?.let { bd ->
            ObjectAnimator.ofFloat(bd, "alpha", 0f, 1f).apply {
                duration     = (openDur * 0.55f).toLong()
                interpolator = DecelerateInterpolator()
                start()
            }
        }

        // 2. Snapshot: fade in + spring-движение от anchorTop к targetTop
        snapshotView?.let { snap ->
            // Fade
            ObjectAnimator.ofFloat(snap, "alpha", 0f, 1f).apply {
                duration     = (openDur * 0.55f).toLong()
                interpolator = DecelerateInterpolator()
                start()
            }
            // Движение по Y (если snapshot должен сдвинуться)
            val dy = (snapshotTargetTop - snapshotStartTop).toFloat()
            if (dy != 0f) {
                ObjectAnimator.ofFloat(snap, "translationY", 0f, dy).apply {
                    duration     = openDur
                    interpolator = DecelerateInterpolator(1.8f)
                    start()
                }
            }
        }

        // Двигаем emoji и actions вместе со snapshot (они стартуют рядом с anchor)
        val dy = (snapshotTargetTop - snapshotStartTop).toFloat()

        // 3. Action menu: scale + fade + translate
        actionMenuView?.let { menu ->
            AnimatorSet().apply {
                val anims = mutableListOf<Animator>(
                    ObjectAnimator.ofFloat(menu, "alpha",  0f,   1f),
                    ObjectAnimator.ofFloat(menu, "scaleX", 0.5f, 1f),
                    ObjectAnimator.ofFloat(menu, "scaleY", 0.5f, 1f),
                )
                if (dy != 0f) anims.add(ObjectAnimator.ofFloat(menu, "translationY", 0f, dy))
                playTogether(anims)
                duration     = openDur
                interpolator = OvershootInterpolator(0.8f)
                start()
            }
        }

        // 4. Emoji panel: scale + fade + translate
        emojiPanelView?.let { emoji ->
            AnimatorSet().apply {
                val anims = mutableListOf<Animator>(
                    ObjectAnimator.ofFloat(emoji, "alpha",  0f,   1f),
                    ObjectAnimator.ofFloat(emoji, "scaleX", 0.5f, 1f),
                    ObjectAnimator.ofFloat(emoji, "scaleY", 0.5f, 1f),
                )
                if (dy != 0f) anims.add(ObjectAnimator.ofFloat(emoji, "translationY", 0f, dy))
                playTogether(anims)
                duration     = openDur
                interpolator = OvershootInterpolator(0.6f)
                startDelay   = (openDur * 0.05f).toLong()
                start()
            }
        }
    }

    private fun animateOut(onEnd: () -> Unit) {
        val closeDur = theme.closeDurationMs

        // Snapshot возвращается к исходной позиции anchor (зеркало iOS returnFrame)
        val dy = (snapshotTargetTop - snapshotStartTop).toFloat()
        val animators = mutableListOf<Animator>()

        backdropView?.let { bd ->
            animators.add(ObjectAnimator.ofFloat(bd, "alpha", bd.alpha, 0f))
        }

        snapshotView?.let { snap ->
            animators.add(ObjectAnimator.ofFloat(snap, "alpha", snap.alpha, 0f))
            if (dy != 0f) animators.add(ObjectAnimator.ofFloat(snap, "translationY", dy, 0f))
        }

        actionMenuView?.let { menu ->
            animators.addAll(listOf(
                ObjectAnimator.ofFloat(menu, "alpha",  menu.alpha,  0f),
                ObjectAnimator.ofFloat(menu, "scaleX", menu.scaleX, 0.7f),
                ObjectAnimator.ofFloat(menu, "scaleY", menu.scaleY, 0.7f),
            ))
            if (dy != 0f) animators.add(ObjectAnimator.ofFloat(menu, "translationY", dy, 0f))
        }

        emojiPanelView?.let { emoji ->
            animators.addAll(listOf(
                ObjectAnimator.ofFloat(emoji, "alpha",  emoji.alpha,  0f),
                ObjectAnimator.ofFloat(emoji, "scaleX", emoji.scaleX, 0.7f),
                ObjectAnimator.ofFloat(emoji, "scaleY", emoji.scaleY, 0.7f),
            ))
            if (dy != 0f) animators.add(ObjectAnimator.ofFloat(emoji, "translationY", dy, 0f))
        }

        AnimatorSet().apply {
            playTogether(animators)
            duration     = closeDur
            interpolator = AccelerateInterpolator()
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) = onEnd()
            })
            start()
        }
    }

    // ─── Builders ─────────────────────────────────────────────────────────────

    private fun buildEmojiPanel(emojis: List<String>): LinearLayout {
        fun dp(v: Float): Int = v.dpToPx(context)

        val itemSize = dp(theme.emojiItemSizeDp)
        val hPad     = dp(ChatLayoutConstants.EMOJI_PANEL_H_PADDING_DP.toFloat())
        val vPad     = dp(ChatLayoutConstants.EMOJI_PANEL_V_PADDING_DP.toFloat())
        val corner   = dp(theme.emojiPanelCornerRadius.toFloat()).toFloat()
        val spacing  = dp(ChatLayoutConstants.EMOJI_PANEL_SPACING_DP.toFloat())

        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = Gravity.CENTER
            background  = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE; cornerRadius = corner; setColor(theme.emojiPanelBackground)
            }
            setPadding(hPad, vPad, hPad, vPad)
            elevation   = 12f
            isClickable = true

            emojis.forEachIndexed { index, emoji ->
                val btn = TextView(context).apply {
                    text = emoji; textSize = theme.emojiFontSizeSp; gravity = Gravity.CENTER
                    val outValue = android.util.TypedValue()
                    context.theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, outValue, true)
                    foreground   = context.getDrawable(outValue.resourceId)
                    isClickable  = true; isFocusable = true
                    setOnClickListener { listener?.onEmojiSelected(emoji); dismiss() }
                }
                addView(btn, LinearLayout.LayoutParams(itemSize, itemSize).apply {
                    if (index > 0) marginStart = spacing / 2
                })
            }
        }
    }

    private fun buildActionMenu(actions: List<ChatAction>, anchorGravity: AnchorGravity): LinearLayout {
        fun dp(v: Float): Int = v.dpToPx(context)
        fun dpF(v: Float): Float = v.dpToPxF(context)

        val corner = dpF(theme.menuCornerRadius)
        val itemH  = dp(theme.actionItemHeightDp)
        val hPad   = dp(theme.actionHorizontalPaddingDp)

        val menu = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background  = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE; cornerRadius = corner; setColor(theme.menuBackground)
            }
            elevation   = 12f
            isClickable = true
            layoutParams = LinearLayout.LayoutParams(dp(theme.menuWidthDp).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        actions.forEachIndexed { index, action ->
            if (index > 0) {
                menu.addView(View(context).apply {
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1)
                    setBackgroundColor(theme.menuSeparatorColor)
                })
            }
            val itemColor = if (action.isDestructive) theme.actionDestructiveTitleColor else theme.actionTitleColor
            val iconColor = if (action.isDestructive) theme.actionDestructiveIconColor  else theme.actionIconColor

            val row = LinearLayout(context).apply {
                orientation  = LinearLayout.HORIZONTAL
                gravity      = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, itemH)
                setPadding(hPad, 0, hPad, 0)
                isClickable = true; isFocusable = true
                val outValue = android.util.TypedValue()
                context.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
                foreground = context.getDrawable(outValue.resourceId)
                setOnClickListener { listener?.onActionSelected(action.id); dismiss() }
            }

            if (!action.systemImage.isNullOrBlank()) {
                val iconSize = dp(20f)
                row.addView(ImageView(context).apply {
                    setImageResource(resolveActionIcon(action.systemImage))
                    setColorFilter(iconColor)
                    layoutParams = LinearLayout.LayoutParams(iconSize, iconSize).apply { marginEnd = hPad }
                })
            }
            row.addView(TextView(context).apply {
                text = action.title; textSize = theme.actionTitleSizeSp; setTextColor(itemColor)
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            })
            menu.addView(row)
        }

        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = if (anchorGravity == AnchorGravity.END) Gravity.END else Gravity.START
            addView(menu)
        }
    }

    private fun resolveActionIcon(sfSymbolName: String): Int = when {
        sfSymbolName.contains("reply",   ignoreCase = true) -> android.R.drawable.ic_menu_revert
        sfSymbolName.contains("copy",    ignoreCase = true) -> android.R.drawable.ic_menu_agenda
        sfSymbolName.contains("trash",   ignoreCase = true) -> android.R.drawable.ic_menu_delete
        sfSymbolName.contains("edit",    ignoreCase = true) -> android.R.drawable.ic_menu_edit
        sfSymbolName.contains("forward", ignoreCase = true) -> android.R.drawable.ic_menu_share
        sfSymbolName.contains("pin",     ignoreCase = true) -> android.R.drawable.ic_menu_set_as
        sfSymbolName.contains("info",    ignoreCase = true) -> android.R.drawable.ic_menu_info_details
        else                                                 -> android.R.drawable.ic_menu_more
    }

    // ─── Screen capture + blur ────────────────────────────────────────────────

    private fun captureScreen(activity: Activity): Bitmap {
        val dv = activity.window.decorView
        val bmp = Bitmap.createBitmap(maxOf(1, dv.width), maxOf(1, dv.height), Bitmap.Config.ARGB_8888)
        dv.draw(Canvas(bmp))
        return bmp
    }

    /**
     * Blur — усилен: scale 0.3 (был 0.25) + radius * 1.5.
     * Зеркалит iOS UIBlurEffect(.systemMaterial) который даёт сильный blur.
     */
    private fun blurBitmap(src: Bitmap): Bitmap {
        // Увеличен radius для более сильного эффекта (как iOS)
        val radius = (theme.backdropBlurRadius * 1.5f).coerceIn(1f, 25f)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            blurWithRenderEffect(src, radius)
        } else {
            blurWithRenderScript(src, radius)
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun blurWithRenderEffect(src: Bitmap, radius: Float): Bitmap {
        val scale   = 0.3f  // больше чем 0.25 — лучше качество blur
        val scaledW = maxOf(1, (src.width  * scale).toInt())
        val scaledH = maxOf(1, (src.height * scale).toInt())
        val scaled  = Bitmap.createScaledBitmap(src, scaledW, scaledH, true)
        val output  = Bitmap.createBitmap(scaledW, scaledH, Bitmap.Config.ARGB_8888)
        val canvas  = Canvas(output)
        val paint   = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        paint.maskFilter = BlurMaskFilter(radius / 3f, BlurMaskFilter.Blur.NORMAL)
        canvas.drawBitmap(scaled, 0f, 0f, paint)
        scaled.recycle()
        return Bitmap.createScaledBitmap(output, src.width, src.height, true).also { output.recycle() }
    }

    @Suppress("DEPRECATION")
    private fun blurWithRenderScript(src: Bitmap, radius: Float): Bitmap {
        return try {
            val scale   = 0.3f
            val scaledW = maxOf(1, (src.width  * scale).toInt())
            val scaledH = maxOf(1, (src.height * scale).toInt())
            val scaled  = Bitmap.createScaledBitmap(src, scaledW, scaledH, true)
            val output  = scaled.copy(Bitmap.Config.ARGB_8888, true)
            val rs      = RenderScript.create(context)
            val input   = Allocation.createFromBitmap(rs, scaled)
            val out     = Allocation.createFromBitmap(rs, output)
            val blur    = ScriptIntrinsicBlur.create(rs, Element.U8_4(rs))
            blur.setRadius(radius.coerceIn(1f, 25f))
            blur.setInput(input); blur.forEach(out); out.copyTo(output)
            rs.destroy(); input.destroy(); out.destroy(); scaled.recycle()
            Bitmap.createScaledBitmap(output, src.width, src.height, true).also { output.recycle() }
        } catch (e: Exception) { src }
    }

    enum class AnchorGravity { START, END }

    companion object {
        fun create(context: Context, theme: ContextMenuTheme): ContextMenuOverlay =
            ContextMenuOverlay(context, theme)
    }
}
