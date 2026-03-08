package com.rnapp.contextmenu

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import android.view.*
import android.widget.*
import androidx.core.view.isVisible
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ContextMenuTheme
import com.rnapp.chat.utils.dpToPx

/**
 * Контекстное меню в стиле Telegram.
 *
 * Структура overlay (добавляется на DecorView Activity):
 *
 *  FrameLayout (fullscreen backdrop, dim + blur)
 *   └─ ScrollView (когда контент не влезает)
 *       └─ LinearLayout (vertical, все контекстное меню)
 *           ├─ [EmojiPanel] LinearLayout (горизонтальный ряд эмодзи)
 *           ├─ [MessageSnapshot] ImageView (снимок пузыря)
 *           └─ [ActionMenu] LinearLayout (вертикальный список действий)
 *
 * Поведение:
 *  • Если всё влезает — ScrollView не нужен, позиционируем вертикально.
 *  • Если не влезает — контент в ScrollView, initialScroll — снизу
 *    (menu видно сразу, эмодзи доступны при скролле вверх).
 *  • Анимация: fade + scale из центра целевого View (как в Telegram).
 *  • Backdrop: затемнение + blur снимка экрана.
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
    private var decorView: ViewGroup? = null
    private var overlayRoot: FrameLayout? = null

    // ── Public API ────────────────────────────────────────────────────────

    fun show(
        activity: android.app.Activity,
        anchorView: View,
        messageBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        anchorGravity: AnchorGravity,
        listener: Listener,
    ) {
        this.listener  = listener
        this.decorView = activity.window.decorView as ViewGroup

        val overlay = buildOverlay(
            context, activity, anchorView, messageBitmap, emojis, actions, anchorGravity
        )
        this.overlayRoot = overlay
        decorView!!.addView(overlay)
        animateIn(overlay)
    }

    fun dismiss() {
        val overlay = overlayRoot ?: return
        animateOut(overlay) {
            decorView?.removeView(overlay)
            overlayRoot = null
            listener?.onDismiss()
        }
    }

    // ── Build ─────────────────────────────────────────────────────────────

    private fun buildOverlay(
        ctx: Context,
        activity: android.app.Activity,
        anchor: View,
        msgBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        gravity: AnchorGravity,
    ): FrameLayout {

        fun dp(v: Float) = v.dpToPx(ctx)

        val screenW = ctx.resources.displayMetrics.widthPixels
        val screenH = ctx.resources.displayMetrics.heightPixels

        // ── Backdrop ───────────────────────────────────────────────────────
        val backdropBitmap = captureScreen(activity)
        val blurred        = blurBitmap(ctx, backdropBitmap)

        val root = FrameLayout(ctx).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setOnClickListener { dismiss() }
        }

        // Blur + dim layer
        val backdropView = ImageView(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setImageBitmap(blurred)
            scaleType = ImageView.ScaleType.FIT_XY
        }
        root.addView(backdropView)

        val dimView = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundColor(theme.backdropColor)
        }
        root.addView(dimView)

        // ── Emoji Panel ────────────────────────────────────────────────────
        val emojiPanel = buildEmojiPanel(ctx, emojis, dp(theme.emojiPanelSpacingDp))

        // ── Message snapshot ───────────────────────────────────────────────
        val msgImage = ImageView(ctx).apply {
            setImageBitmap(msgBitmap)
            scaleType = ImageView.ScaleType.FIT_START

            // Shadow
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                outlineProvider = ViewOutlineProvider.BACKGROUND
                clipToOutline   = false
            }
            elevation = ChatLayoutConstants.BUBBLE_SHADOW_RADIUS_DP.dpToPx(ctx).toFloat()
        }

        // ── Action Menu ────────────────────────────────────────────────────
        val actionMenu = buildActionMenu(ctx, actions, gravity)

        // ── Layout content ─────────────────────────────────────────────────
        val menuSpacing  = dp(theme.menuSpacingDp)
        val emojiSpacing = dp(theme.emojiPanelSpacingDp)
        val hMargin      = dp(theme.horizontalPaddingDp)
        val vMargin      = dp(theme.verticalPaddingDp)

        val contentLayout = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(hMargin, vMargin, hMargin, vMargin)
        }

        // Order: emoji → message → actions
        contentLayout.addView(emojiPanel, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = emojiSpacing })
        contentLayout.addView(msgImage, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, msgBitmap.height
        ).apply { bottomMargin = menuSpacing })
        contentLayout.addView(actionMenu, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        // ── Measure total height needed ────────────────────────────────────
        contentLayout.measure(
            View.MeasureSpec.makeMeasureSpec(screenW, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
        )
        val totalH = contentLayout.measuredHeight

        if (totalH <= screenH) {
            // ── Fits: position vertically centered around anchor ───────────
            val anchorLoc = IntArray(2); anchor.getLocationOnScreen(anchorLoc)
            val anchorCenterY = anchorLoc[1] + anchor.height / 2

            val top = (anchorCenterY - totalH / 2).coerceIn(vMargin, screenH - totalH - vMargin)

            val contentLp = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, totalH, Gravity.TOP).apply {
                topMargin = top
            }
            root.addView(contentLayout, contentLp)
        } else {
            // ── Doesn't fit: wrap in ScrollView, start at bottom ──────────
            val scrollView = ScrollView(ctx).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
                )
                isVerticalScrollBarEnabled = false
                addView(contentLayout)
            }
            root.addView(scrollView)

            // Scroll to bottom so action menu is visible first
            scrollView.post {
                scrollView.fullScroll(View.FOCUS_DOWN)
            }
        }

        return root
    }

    // ── Emoji panel ───────────────────────────────────────────────────────

    private fun buildEmojiPanel(ctx: Context, emojis: List<String>, spacing: Int): LinearLayout {
        fun dp(v: Float) = v.dpToPx(ctx)

        val itemSize = dp(theme.emojiItemSizeDp)
        val hPad     = dp(ChatLayoutConstants.EMOJI_PANEL_H_PADDING_DP)
        val vPad     = dp(ChatLayoutConstants.EMOJI_PANEL_V_PADDING_DP)
        val corner   = dp(theme.emojiPanelCornerRadius)

        return LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = Gravity.CENTER
            val bg = GradientDrawable().apply {
                shape        = GradientDrawable.RECTANGLE
                cornerRadius = corner.toFloat()
                setColor(theme.emojiPanelBackground)
            }
            background = bg
            setPadding(hPad, vPad, hPad, vPad)
            elevation = 12f

            emojis.forEach { emoji ->
                val btn = TextView(ctx).apply {
                    text     = emoji
                    textSize = theme.emojiFontSizeSp
                    gravity  = Gravity.CENTER
                    layoutParams = LinearLayout.LayoutParams(itemSize, itemSize).also { lp ->
                        if (childCount > 0) lp.marginStart = spacing / 2
                    }
                    setOnClickListener { listener?.onEmojiSelected(emoji) }

                    // Ripple on touch
                    val outValue = android.util.TypedValue()
                    ctx.theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, outValue, true)
                    foreground = ctx.getDrawable(outValue.resourceId)
                }
                addView(btn)
            }
        }
    }

    // ── Action menu ───────────────────────────────────────────────────────

    private fun buildActionMenu(ctx: Context, actions: List<ChatAction>, anchorGravity: AnchorGravity): LinearLayout {
        fun dp(v: Float) = v.dpToPx(ctx)

        val corner  = dp(theme.menuCornerRadius)
        val itemH   = dp(theme.actionItemHeightDp)
        val hPad    = dp(theme.actionHorizontalPaddingDp)
        val sepH    = dp(0.5f)

        val menu = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background  = GradientDrawable().apply {
                shape        = GradientDrawable.RECTANGLE
                cornerRadius = corner.toFloat()
                setColor(theme.menuBackground)
            }
            elevation = 12f
            val menuW = dp(theme.menuWidthDp)
            layoutParams = LinearLayout.LayoutParams(menuW.toInt(), ViewGroup.LayoutParams.WRAP_CONTENT)

            // Align to message side
            (layoutParams as? LinearLayout.LayoutParams)?.gravity =
                if (anchorGravity == AnchorGravity.END) Gravity.END else Gravity.START
        }

        actions.forEachIndexed { index, action ->
            if (index > 0) {
                // Separator
                val sep = View(ctx).apply {
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, maxOf(1, sepH))
                    setBackgroundColor(theme.menuSeparatorColor)
                }
                menu.addView(sep)
            }

            val item = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity     = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, itemH)
                setPadding(hPad, 0, hPad, 0)
                isClickable  = true
                isFocusable  = true
                val outValue = android.util.TypedValue()
                ctx.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
                foreground = ctx.getDrawable(outValue.resourceId)
                setOnClickListener { listener?.onActionSelected(action.id); dismiss() }
            }

            val color = if (action.isDestructive) theme.actionDestructiveTitleColor else theme.actionTitleColor
            val iconColor = if (action.isDestructive) theme.actionDestructiveIconColor else theme.actionIconColor

            // Icon
            if (!action.systemImage.isNullOrBlank()) {
                val icon = ImageView(ctx).apply {
                    val s = dp(20f)
                    layoutParams = LinearLayout.LayoutParams(s, s).apply { marginEnd = hPad }
                    setColorFilter(iconColor)
                    // action.systemImage — имя ресурса или системной иконки
                    // В реальном проекте маппируйте SF Symbol name → Android drawable
                    setImageResource(android.R.drawable.ic_menu_info_details)
                }
                item.addView(icon)
            }

            val title = TextView(ctx).apply {
                text     = action.title
                textSize = theme.actionTitleSizeSp
                setTextColor(color)
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            }
            item.addView(title)
            menu.addView(item)
        }

        // Wrap in FrameLayout to support gravity
        return LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = if (anchorGravity == AnchorGravity.END) Gravity.END else Gravity.START
            addView(menu)
        }
    }

    // ── Animation ─────────────────────────────────────────────────────────

    private fun animateIn(overlay: FrameLayout) {
        overlay.alpha    = 0f
        overlay.scaleX   = 0.92f
        overlay.scaleY   = 0.92f

        val fade  = ObjectAnimator.ofFloat(overlay, "alpha",  0f, 1f)
        val scaleX = ObjectAnimator.ofFloat(overlay, "scaleX", 0.92f, 1f)
        val scaleY = ObjectAnimator.ofFloat(overlay, "scaleY", 0.92f, 1f)

        AnimatorSet().apply {
            playTogether(fade, scaleX, scaleY)
            duration = theme.openDurationMs
            interpolator = android.view.animation.DecelerateInterpolator()
            start()
        }
    }

    private fun animateOut(overlay: FrameLayout, onEnd: () -> Unit) {
        val fade  = ObjectAnimator.ofFloat(overlay, "alpha",  1f, 0f)
        val scaleX = ObjectAnimator.ofFloat(overlay, "scaleX", 1f, 0.92f)
        val scaleY = ObjectAnimator.ofFloat(overlay, "scaleY", 1f, 0.92f)

        AnimatorSet().apply {
            playTogether(fade, scaleX, scaleY)
            duration = theme.closeDurationMs
            interpolator = android.view.animation.AccelerateInterpolator()
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) = onEnd()
            })
            start()
        }
    }

    // ── Screen capture + blur ─────────────────────────────────────────────

    private fun captureScreen(activity: android.app.Activity): Bitmap {
        val view = activity.window.decorView
        val bmp  = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        view.draw(canvas)
        return bmp
    }

    @Suppress("DEPRECATION")
    private fun blurBitmap(ctx: Context, src: Bitmap): Bitmap {
        val radius = theme.backdropBlurRadius.coerceIn(1f, 25f)
        return try {
            val scaled = Bitmap.createScaledBitmap(src, src.width / 4, src.height / 4, false)
            val output = Bitmap.createBitmap(scaled)
            val rs     = RenderScript.create(ctx)
            val input  = Allocation.createFromBitmap(rs, scaled)
            val out    = Allocation.createFromBitmap(rs, output)
            val blur   = ScriptIntrinsicBlur.create(rs, Element.U8_4(rs))
            blur.setRadius(radius)
            blur.setInput(input)
            blur.forEach(out)
            out.copyTo(output)
            rs.destroy()
            // Scale back up
            Bitmap.createScaledBitmap(output, src.width, src.height, false)
        } catch (e: Exception) {
            src
        }
    }

    // ── Factory ───────────────────────────────────────────────────────────

    enum class AnchorGravity { START, END }

    companion object {
        fun create(context: Context, theme: ContextMenuTheme) =
            ContextMenuOverlay(context, theme)
    }
}
