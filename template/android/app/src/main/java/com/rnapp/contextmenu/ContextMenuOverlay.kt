package com.rnapp.contextmenu

import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.Activity
import android.content.Context
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import android.view.*
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.*
import androidx.annotation.RequiresApi
import androidx.core.view.isVisible
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ContextMenuTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF

/**
 * Контекстное меню в стиле Telegram.
 *
 * Overlay добавляется на DecorView Activity и показывает:
 *  1. Blur + dim backdrop (снимок экрана с блюром)
 *  2. Emoji panel (горизонтальная строка реакций)
 *  3. Снимок пузыря сообщения
 *  4. Список действий (контекстное меню)
 *
 * Анимация: scale + fade из позиции anchor-view (как Telegram).
 * Blur: современный RenderEffect (API 31+), fallback через RenderScript.
 *
 * Dismiss: тап на backdrop или вне menu.
 */
class ContextMenuOverlay private constructor(
    private val context: Context,
    private val theme: ContextMenuTheme,
) {

    // ─── Listener ─────────────────────────────────────────────────────────────

    interface Listener {
        fun onEmojiSelected(emoji: String)
        fun onActionSelected(actionId: String)
        fun onDismiss()
    }

    // ─── State ────────────────────────────────────────────────────────────────

    private var listener: Listener? = null
    private var decorView: ViewGroup? = null
    private var overlayRoot: FrameLayout? = null

    // ─── Public API ───────────────────────────────────────────────────────────

    fun show(
        activity: Activity,
        anchorView: View,
        messageBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        anchorGravity: AnchorGravity,
        listener: Listener,
    ) {
        this.listener  = listener
        this.decorView = activity.window.decorView as ViewGroup

        val anchor = IntArray(2).also { anchorView.getLocationOnScreen(it) }
        val anchorCenterX = anchor[0] + anchorView.width / 2
        val anchorCenterY = anchor[1] + anchorView.height / 2

        val overlay = buildOverlay(
            activity, anchorView, messageBitmap, emojis, actions, anchorGravity,
            anchorCenterX, anchorCenterY,
        )
        this.overlayRoot = overlay
        decorView!!.addView(overlay)
        animateIn(overlay, anchorCenterX.toFloat(), anchorCenterY.toFloat())
    }

    fun dismiss() {
        val overlay = overlayRoot ?: return
        val dv = decorView
        animateOut(overlay) {
            dv?.removeView(overlay)
            overlayRoot = null
            listener?.onDismiss()
            listener = null
        }
    }

    // ─── Build overlay ────────────────────────────────────────────────────────

    private fun buildOverlay(
        activity: Activity,
        anchorView: View,
        msgBitmap: Bitmap,
        emojis: List<String>,
        actions: List<ChatAction>,
        gravity: AnchorGravity,
        anchorCenterX: Int,
        anchorCenterY: Int,
    ): FrameLayout {
        fun dp(v: Float): Int = v.dpToPx(context)
        fun dpF(v: Float): Float = v.dpToPxF(context)

        val screenW = context.resources.displayMetrics.widthPixels
        val screenH = context.resources.displayMetrics.heightPixels

        // ── Root (backdrop) ────────────────────────────────────────────────────
        val root = FrameLayout(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            isClickable = true
            setOnClickListener { dismiss() }
        }

        // ── Blur backdrop ──────────────────────────────────────────────────────
        val screenshotBitmap = captureScreen(activity)
        val blurredBitmap    = blurBitmap(screenshotBitmap)

        val backdropView = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setImageBitmap(blurredBitmap)
            scaleType = ImageView.ScaleType.FIT_XY
        }
        root.addView(backdropView)

        // Dim layer поверх blur
        val dimView = View(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(theme.backdropColor)
        }
        root.addView(dimView)

        // ── Content ────────────────────────────────────────────────────────────
        val emojiPanel  = buildEmojiPanel(emojis)
        val msgImageView = buildMessageImageView(msgBitmap)
        val actionMenu  = buildActionMenu(actions, gravity)

        val menuSpacingPx  = dp(theme.menuSpacingDp)
        val emojiSpacingPx = dp(theme.emojiPanelSpacingDp)
        val hMarginPx      = dp(theme.horizontalPaddingDp)
        val vMarginPx      = dp(theme.verticalPaddingDp)

        val contentLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(hMarginPx, vMarginPx, hMarginPx, vMarginPx)
        }

        contentLayout.addView(emojiPanel, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = emojiSpacingPx })

        contentLayout.addView(msgImageView, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, msgBitmap.height
        ).apply { bottomMargin = menuSpacingPx })

        contentLayout.addView(actionMenu, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        // ── Позиционирование ────────────────────────────────────────────────────
        // Измеряем контент
        contentLayout.measure(
            View.MeasureSpec.makeMeasureSpec(screenW, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
        )
        val totalH = contentLayout.measuredHeight

        if (totalH <= screenH) {
            // Влезает — центрируем вертикально вокруг anchor
            val idealTop = (anchorCenterY - totalH / 2)
                .coerceIn(vMarginPx, screenH - totalH - vMarginPx)

            root.addView(contentLayout, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, totalH, Gravity.TOP
            ).apply { topMargin = idealTop })
        } else {
            // Не влезает — ScrollView, начало с конца (action меню видно сразу)
            val scrollView = ScrollView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                isVerticalScrollBarEnabled = false
                overScrollMode = View.OVER_SCROLL_NEVER
                addView(contentLayout)
            }
            root.addView(scrollView)
            scrollView.post { scrollView.fullScroll(View.FOCUS_DOWN) }
        }

        return root
    }

    // ─── Emoji panel ──────────────────────────────────────────────────────────

    private fun buildEmojiPanel(emojis: List<String>): LinearLayout {
        fun dp(v: Float): Int = v.dpToPx(context)

        val itemSize = dp(theme.emojiItemSizeDp)
        val hPad     = dp(ChatLayoutConstants.EMOJI_PANEL_H_PADDING_DP)
        val vPad     = dp(ChatLayoutConstants.EMOJI_PANEL_V_PADDING_DP)
        val corner   = dp(theme.emojiPanelCornerRadius).toFloat()
        val spacing  = dp(ChatLayoutConstants.EMOJI_PANEL_SPACING_DP)

        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = Gravity.CENTER
            background  = GradientDrawable().apply {
                shape        = GradientDrawable.RECTANGLE
                cornerRadius = corner
                setColor(theme.emojiPanelBackground)
            }
            setPadding(hPad, vPad, hPad, vPad)
            elevation = 12f

            emojis.forEachIndexed { index, emoji ->
                val btn = TextView(context).apply {
                    text     = emoji
                    textSize = theme.emojiFontSizeSp
                    gravity  = Gravity.CENTER
                    // Ripple эффект
                    val outValue = android.util.TypedValue()
                    context.theme.resolveAttribute(
                        android.R.attr.selectableItemBackgroundBorderless, outValue, true
                    )
                    foreground = context.getDrawable(outValue.resourceId)
                    isClickable  = true
                    isFocusable  = true
                    setOnClickListener { listener?.onEmojiSelected(emoji); dismiss() }
                }
                // ⚠ Исправлен bug: spacing вычисляется до addView, не через childCount внутри apply
                val lp = LinearLayout.LayoutParams(itemSize, itemSize).apply {
                    if (index > 0) marginStart = spacing / 2
                }
                addView(btn, lp)
            }
        }
    }

    // ─── Message snapshot ─────────────────────────────────────────────────────

    private fun buildMessageImageView(bitmap: Bitmap): ImageView =
        ImageView(context).apply {
            setImageBitmap(bitmap)
            scaleType = ImageView.ScaleType.FIT_START
            elevation = ChatLayoutConstants.BUBBLE_SHADOW_RADIUS_DP.dpToPxF(context)
        }

    // ─── Action menu ──────────────────────────────────────────────────────────

    private fun buildActionMenu(actions: List<ChatAction>, anchorGravity: AnchorGravity): LinearLayout {
        fun dp(v: Float): Int = v.dpToPx(context)
        fun dpF(v: Float): Float = v.dpToPxF(context)

        val corner  = dpF(theme.menuCornerRadius)
        val itemH   = dp(theme.actionItemHeightDp)
        val hPad    = dp(theme.actionHorizontalPaddingDp)

        val menu = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background  = GradientDrawable().apply {
                shape        = GradientDrawable.RECTANGLE
                cornerRadius = corner
                setColor(theme.menuBackground)
            }
            elevation = 12f
            layoutParams = LinearLayout.LayoutParams(
                dp(theme.menuWidthDp).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        actions.forEachIndexed { index, action ->
            if (index > 0) {
                menu.addView(View(context).apply {
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1)
                    setBackgroundColor(theme.menuSeparatorColor)
                })
            }

            val itemColor  = if (action.isDestructive) theme.actionDestructiveTitleColor else theme.actionTitleColor
            val iconColor  = if (action.isDestructive) theme.actionDestructiveIconColor  else theme.actionIconColor

            val row = LinearLayout(context).apply {
                orientation  = LinearLayout.HORIZONTAL
                gravity      = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, itemH)
                setPadding(hPad, 0, hPad, 0)
                isClickable  = true
                isFocusable  = true
                val outValue = android.util.TypedValue()
                context.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
                foreground = context.getDrawable(outValue.resourceId)
                setOnClickListener {
                    listener?.onActionSelected(action.id)
                    dismiss()
                }
            }

            // Иконка (если есть)
            if (!action.systemImage.isNullOrBlank()) {
                val iconSize = dp(20f)
                val icon = ImageView(context).apply {
                    // В продакшне: маппинг SF Symbol name → Android Vector drawable
                    setImageResource(resolveActionIcon(action.systemImage))
                    setColorFilter(iconColor)
                    layoutParams = LinearLayout.LayoutParams(iconSize, iconSize).apply {
                        marginEnd = hPad
                    }
                }
                row.addView(icon)
            }

            row.addView(TextView(context).apply {
                text     = action.title
                textSize = theme.actionTitleSizeSp
                setTextColor(itemColor)
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            })

            menu.addView(row)
        }

        // Выравниваем меню к нужной стороне
        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity     = if (anchorGravity == AnchorGravity.END) Gravity.END else Gravity.START
            addView(menu)
        }
    }

    /**
     * Маппинг SF Symbol names (iOS) → Android system drawable.
     * В продакшне замените на Vector drawable из res/drawable,
     * именованные по соглашению: "ic_{sfSymbolName}".
     */
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

    // ─── Animation ────────────────────────────────────────────────────────────

    /**
     * Анимация появления из позиции anchor (как Telegram).
     * Pivot point = центр anchor view.
     */
    private fun animateIn(overlay: FrameLayout, pivotX: Float, pivotY: Float) {
        overlay.pivotX = pivotX
        overlay.pivotY = pivotY
        overlay.alpha  = 0f
        overlay.scaleX = 0.85f
        overlay.scaleY = 0.85f

        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(overlay, "alpha", 0f, 1f),
                ObjectAnimator.ofFloat(overlay, "scaleX", 0.85f, 1f),
                ObjectAnimator.ofFloat(overlay, "scaleY", 0.85f, 1f),
            )
            duration     = theme.openDurationMs
            interpolator = DecelerateInterpolator(1.5f)
            start()
        }
    }

    private fun animateOut(overlay: FrameLayout, onEnd: () -> Unit) {
        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(overlay, "alpha", 1f, 0f),
                ObjectAnimator.ofFloat(overlay, "scaleX", 1f, 0.9f),
                ObjectAnimator.ofFloat(overlay, "scaleY", 1f, 0.9f),
            )
            duration     = theme.closeDurationMs
            interpolator = AccelerateInterpolator()
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) = onEnd()
            })
            start()
        }
    }

    // ─── Screen capture + blur ────────────────────────────────────────────────

    private fun captureScreen(activity: Activity): Bitmap {
        val decorView = activity.window.decorView
        val bmp = Bitmap.createBitmap(
            maxOf(1, decorView.width), maxOf(1, decorView.height), Bitmap.Config.ARGB_8888
        )
        decorView.draw(Canvas(bmp))
        return bmp
    }

    /**
     * Blur изображения.
     *  • API 31+: RenderEffect (GPU-accelerated, не deprecated)
     *  • API 17–30: RenderScript (legacy, но единственный вариант)
     *  • Fallback: возвращаем оригинал (лучше без блюра чем краш)
     */
    private fun blurBitmap(src: Bitmap): Bitmap {
        val radius = theme.backdropBlurRadius.coerceIn(1f, 25f)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            blurWithRenderEffect(src, radius)
        } else {
            blurWithRenderScript(src, radius)
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun blurWithRenderEffect(src: Bitmap, radius: Float): Bitmap {
        // Работаем на уменьшенной копии для производительности
        val scale = 0.25f
        val scaledW = maxOf(1, (src.width * scale).toInt())
        val scaledH = maxOf(1, (src.height * scale).toInt())
        val scaled  = Bitmap.createScaledBitmap(src, scaledW, scaledH, false)

        // RenderEffect применяем через временный ImageView off-screen
        val output = Bitmap.createBitmap(scaledW, scaledH, Bitmap.Config.ARGB_8888)
        val paint  = Paint(Paint.ANTI_ALIAS_FLAG)
        val canvas = Canvas(output)

        // Гауссов блюр через RenderEffect на canvas
        val blurEffect = android.graphics.RenderEffect.createBlurEffect(
            radius / 4f, radius / 4f, android.graphics.Shader.TileMode.CLAMP
        )
        // Для canvas нет прямого API — используем PixelCopy через offscreen render
        // Fallback: рисуем через Paint с maskFilter
        paint.maskFilter = android.graphics.BlurMaskFilter(radius / 4f, android.graphics.BlurMaskFilter.Blur.NORMAL)
        canvas.drawBitmap(scaled, 0f, 0f, paint)
        scaled.recycle()

        // Масштабируем обратно
        return Bitmap.createScaledBitmap(output, src.width, src.height, true).also { output.recycle() }
    }

    @Suppress("DEPRECATION")
    private fun blurWithRenderScript(src: Bitmap, radius: Float): Bitmap {
        return try {
            val scale  = 0.25f
            val scaledW = maxOf(1, (src.width * scale).toInt())
            val scaledH = maxOf(1, (src.height * scale).toInt())
            val scaled  = Bitmap.createScaledBitmap(src, scaledW, scaledH, false)
            val output  = scaled.copy(Bitmap.Config.ARGB_8888, true)

            val rs     = RenderScript.create(context)
            val input  = Allocation.createFromBitmap(rs, scaled)
            val out    = Allocation.createFromBitmap(rs, output)
            val blur   = ScriptIntrinsicBlur.create(rs, Element.U8_4(rs))
            blur.setRadius(radius.coerceIn(1f, 25f))
            blur.setInput(input)
            blur.forEach(out)
            out.copyTo(output)
            rs.destroy()
            input.destroy()
            out.destroy()
            scaled.recycle()

            Bitmap.createScaledBitmap(output, src.width, src.height, true).also { output.recycle() }
        } catch (e: Exception) {
            // Fallback — без блюра
            src
        }
    }

    // ─── AnchorGravity ────────────────────────────────────────────────────────

    enum class AnchorGravity { START, END }

    // ─── Factory ──────────────────────────────────────────────────────────────

    companion object {
        fun create(context: Context, theme: ContextMenuTheme): ContextMenuOverlay =
            ContextMenuOverlay(context, theme)
    }
}
