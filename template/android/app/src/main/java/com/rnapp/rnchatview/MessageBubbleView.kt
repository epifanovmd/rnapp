package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.isVisible
import com.rnapp.rnchatview.ChatLayoutConstants as C

// ─── MessageBubbleView ────────────────────────────────────────────────────────
//
// Компоновка пузыря: [reply preview] → [content] → [footer].
// Аналог Swift MessageBubbleView + MessageCell.
//
// Архитектура: isMine задаётся при создании — определяет выравнивание.
// configure() вызывается при каждом bind — обновляет данные без создания новых views.

class MessageBubbleView(
    context: Context,
    private val isMine: Boolean,
) : FrameLayout(context) {

    // ─── Subviews ──────────────────────────────────────────────────────────

    private val outerRow    = LinearLayout(context)   // горизонтальная строка (с отступами)
    private val bubble      = LinearLayout(context)   // сам пузырь
    private val replyPreview = ReplyPreviewView(context)
    private val contentArea = LinearLayout(context)   // текст и/или изображение
    private val textView    = TextView(context)
    private val imageView   = ImageView(context)
    private val footerRow   = LinearLayout(context)
    private val editedLabel = TextView(context)
    private val timeLabel   = TextView(context)
    private val statusView  = StatusIconView(context)

    // ─── Callbacks ────────────────────────────────────────────────────────

    var onReplyTap: ((replyId: String) -> Unit)? = null

    /** The bubble view used as anchor for context menu snapshot */
    val bubbleView: View get() = bubble
    /** Whether this is the current user's message */
    val isMineMessage: Boolean get() = isMine

    // ─── Init ─────────────────────────────────────────────────────────────

    init {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        buildLayout()
    }

    // ─── Public API ───────────────────────────────────────────────────────

    fun configure(
        message: ChatMessage,
        resolvedReply: ResolvedReply?,
        theme: ChatTheme,
    ) {
        applyBubbleColors(theme)
        configureReply(resolvedReply, theme)
        configureContent(message, theme)
        configureFooter(message, theme)
    }

    fun prepareForReuse() {
        imageView.setImageBitmap(null)
        ChatImageLoader.cancel(imageView)
    }

    // ─── Layout ───────────────────────────────────────────────────────────

    private fun buildLayout() {
        val sideMargin    = context.dpToPx(C.CELL_SIDE_MARGIN_DP)
        val farSideMargin = context.dpToPx(C.CELL_SIDE_MARGIN_DP + (context.resources.displayMetrics.widthPixels * (1 - C.BUBBLE_MAX_WIDTH_RATIO)).toInt() / context.resources.displayMetrics.density).let {
            // упрощённый расчёт: дальняя сторона = 22% ширины экрана
            (context.resources.displayMetrics.widthPixels * (1f - C.BUBBLE_MAX_WIDTH_RATIO)).toInt()
        }
        val vertPad       = context.dpToPx(C.CELL_VERTICAL_PADDING_DP)

        // outerRow: горизонтальная строка с отступами
        outerRow.orientation = LinearLayout.HORIZONTAL
        outerRow.gravity     = if (isMine) Gravity.END else Gravity.START
        val outerParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin    = vertPad
            bottomMargin = vertPad
        }
        outerRow.layoutParams = outerParams

        // bubble: вертикальный контейнер
        bubble.orientation = LinearLayout.VERTICAL
        val bubbleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            if (isMine) {
                marginStart = farSideMargin
                marginEnd   = sideMargin
            } else {
                marginStart = sideMargin
                marginEnd   = farSideMargin
            }
        }
        bubble.layoutParams = bubbleParams
        applyBubbleShape()

        val hPad = context.dpToPx(C.BUBBLE_HORIZONTAL_PADDING_DP)
        val tPad = context.dpToPx(C.BUBBLE_TOP_PADDING_DP)
        val bPad = context.dpToPx(C.BUBBLE_BOTTOM_PADDING_DP)
        bubble.setPadding(hPad, tPad, hPad, bPad)

        // replyPreview
        replyPreview.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = context.dpToPx(C.STACK_SPACING_DP) }

        // contentArea: текст + изображение
        contentArea.orientation = LinearLayout.VERTICAL
        contentArea.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )

        // textView
        textView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
        textView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        )

        // imageView
        imageView.scaleType = ImageView.ScaleType.CENTER_CROP
        imageView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(200f)
        ).apply { topMargin = context.dpToPx(C.STACK_SPACING_DP) }

        contentArea.addView(textView)
        contentArea.addView(imageView)

        // footerRow
        footerRow.orientation = LinearLayout.HORIZONTAL
        footerRow.gravity     = Gravity.CENTER_VERTICAL or Gravity.END
        footerRow.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = context.dpToPx(C.FOOTER_TOP_SPACING_DP) }

        editedLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.FOOTER_TEXT_SIZE_SP)
        editedLabel.text    = "edited"
        editedLabel.visibility = View.GONE
        editedLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginEnd = context.dpToPx(C.FOOTER_SPACING_DP) }

        timeLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.FOOTER_TEXT_SIZE_SP)
        timeLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginEnd = context.dpToPx(C.FOOTER_SPACING_DP) }

        statusView.layoutParams = LinearLayout.LayoutParams(
            context.dpToPx(C.STATUS_ICON_SIZE_DP), context.dpToPx(C.STATUS_ICON_SIZE_DP)
        )

        footerRow.addView(editedLabel)
        footerRow.addView(timeLabel)
        footerRow.addView(statusView)

        bubble.addView(replyPreview)
        bubble.addView(contentArea)
        bubble.addView(footerRow)

        outerRow.addView(bubble)
        addView(outerRow)
    }

    private fun applyBubbleShape() {
        val r = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP).toFloat()
        val t = context.dpToPx(C.BUBBLE_TAIL_CORNER_RADIUS_DP).toFloat()
        // iOS-стиль «хвоста»: tl, tr, br, bl
        val radii = if (isMine)
            floatArrayOf(r, r, t, t, r, r, r, r)   // правый верх — тупой угол
        else
            floatArrayOf(t, t, r, r, r, r, r, r)   // левый верх — тупой угол

        bubble.background = GradientDrawable().apply {
            cornerRadii = radii
        }
    }

    // ─── Configure helpers ────────────────────────────────────────────────

    private fun applyBubbleColors(theme: ChatTheme) {
        val color = if (isMine) theme.outgoingBubbleColor else theme.incomingBubbleColor
        (bubble.background as? GradientDrawable)?.setColor(color)
    }

    private fun configureReply(resolved: ResolvedReply?, theme: ChatTheme) {
        when (resolved) {
            is ResolvedReply.Found -> {
                replyPreview.isVisible = true
                replyPreview.configure(resolved.info, isMine, theme)
                replyPreview.setOnClickListener {
                    onReplyTap?.invoke(resolved.info.replyToId)
                }
            }
            is ResolvedReply.Deleted, null -> {
                replyPreview.isVisible = false
            }
        }
    }

    private fun configureContent(message: ChatMessage, theme: ChatTheme) {
        val textColor = if (isMine) theme.outgoingTextColor else theme.incomingTextColor

        when (message.content) {
            is MessageContent.Text -> {
                textView.isVisible  = true
                imageView.isVisible = false
                textView.text       = message.content.textBody
                textView.setTextColor(textColor)
            }
            is MessageContent.Image -> {
                textView.isVisible  = false
                imageView.isVisible = true
                loadImage(message.content.imagePayload!!)
            }
            is MessageContent.Mixed -> {
                textView.isVisible  = true
                imageView.isVisible = true
                textView.text       = message.content.textBody
                textView.setTextColor(textColor)
                loadImage(message.content.imagePayload!!)
            }
        }
    }

    private fun loadImage(payload: MessageContent.ImagePayload) {
        val w = context.dpToPx(200f)
        val h = context.dpToPx(200f)
        val url = payload.thumbnailUrl?.takeIf { it.isNotBlank() } ?: payload.url
        // Обновить высоту imageView под aspect ratio если известны размеры
        if (payload.width != null && payload.width > 0 && payload.height != null && payload.height > 0) {
            val ratio = payload.height / payload.width
            val scaledH = (w * ratio).toInt()
            imageView.layoutParams = (imageView.layoutParams as LinearLayout.LayoutParams).apply {
                width  = w
                height = scaledH
            }
        }
        imageView.background = GradientDrawable().apply {
            setColor(Color.parseColor("#E5E5EA"))
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP).toFloat()
        }
        ChatImageLoader.load(context, url, imageView,
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP),
            targetW = w, targetH = h,
        )
    }

    private fun configureFooter(message: ChatMessage, theme: ChatTheme) {
        val timeColor   = if (isMine) theme.outgoingTimeColor   else theme.incomingTimeColor
        val editedColor = if (isMine) theme.outgoingEditedColor else theme.incomingEditedColor

        timeLabel.text      = DateHelper.timeString(message.timestamp)
        timeLabel.setTextColor(timeColor)

        editedLabel.isVisible = message.isEdited
        editedLabel.setTextColor(editedColor)

        statusView.configure(message.status, isMine, theme)
    }
}

// ─── ReplyPreviewView ─────────────────────────────────────────────────────────
//
// Панель цитаты внутри пузыря. Аналог Swift ReplyPreviewView.

class ReplyPreviewView(context: Context) : LinearLayout(context) {

    private val accentBar  = View(context)
    private val column     = LinearLayout(context)
    private val senderLabel = TextView(context)
    private val bodyLabel  = TextView(context)

    init {
        orientation = HORIZONTAL
        setPadding(
            context.dpToPx(8f), context.dpToPx(6f),
            context.dpToPx(8f), context.dpToPx(6f)
        )
        isClickable = true; isFocusable = true

        val barParams = LayoutParams(context.dpToPx(C.REPLY_BAR_WIDTH_DP), LayoutParams.MATCH_PARENT).apply {
            marginEnd = context.dpToPx(8f)
        }
        accentBar.layoutParams = barParams
        accentBar.background = GradientDrawable().apply {
            cornerRadius = context.dpToPx(2f).toFloat()
        }

        column.orientation = VERTICAL
        column.layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)

        senderLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12f)
        senderLabel.setTypeface(null, android.graphics.Typeface.BOLD)
        senderLabel.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)

        bodyLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12f)
        bodyLabel.maxLines = 2
        bodyLabel.ellipsize = android.text.TextUtils.TruncateAt.END
        bodyLabel.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)

        column.addView(senderLabel)
        column.addView(bodyLabel)
        addView(accentBar)
        addView(column)
    }

    fun configure(info: ReplyDisplayInfo, isMine: Boolean, theme: ChatTheme) {
        val bgColor     = if (isMine) theme.outgoingReplyBackground else theme.incomingReplyBackground
        val accentColor = if (isMine) theme.outgoingReplyAccent     else theme.incomingReplyAccent
        val senderColor = if (isMine) theme.outgoingReplySender     else theme.incomingReplySender
        val textColor   = if (isMine) theme.outgoingReplyText       else theme.incomingReplyText

        background = GradientDrawable().apply {
            setColor(bgColor)
            cornerRadius = context.dpToPx(C.REPLY_CORNER_RADIUS_DP).toFloat()
        }
        (accentBar.background as? GradientDrawable)?.setColor(accentColor)

        senderLabel.text = info.senderName ?: ""
        senderLabel.setTextColor(senderColor)
        senderLabel.isVisible = !info.senderName.isNullOrBlank()

        bodyLabel.text = when {
            info.text != null  -> info.text
            info.hasImage      -> "📷 Photo"
            else               -> ""
        }
        bodyLabel.setTextColor(textColor)
    }
}

// ─── StatusIconView ───────────────────────────────────────────────────────────
//
// Иконка статуса сообщения. Аналог Swift MessageStatusView.

class StatusIconView(context: Context) : TextView(context) {

    init {
        setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 10f)
        gravity = Gravity.CENTER
    }

    fun configure(status: MessageStatus, isMine: Boolean, theme: ChatTheme) {
        if (!isMine) {
            isVisible = false
            return
        }
        isVisible = true
        val (icon, color) = when (status) {
            MessageStatus.SENDING   -> "⏳" to theme.outgoingStatusColor
            MessageStatus.SENT      -> "✓"  to theme.outgoingStatusColor
            MessageStatus.DELIVERED -> "✓✓" to theme.outgoingStatusColor
            MessageStatus.READ      -> "✓✓" to theme.outgoingStatusReadColor
        }
        text = icon
        setTextColor(color)
    }
}

// ─── DateSeparatorView ────────────────────────────────────────────────────────

class DateSeparatorView(context: Context) : FrameLayout(context) {

    private val label = TextView(context)

    init {
        layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            context.dpToPx(C.DATE_SEPARATOR_HEIGHT_DP)
        )

        label.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.DATE_SEPARATOR_TEXT_SIZE_SP)
        label.gravity = Gravity.CENTER
        val hPad = context.dpToPx(14f)
        val vPad = context.dpToPx(4f)
        label.setPadding(hPad, vPad, hPad, vPad)

        val lp = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        addView(label, lp)
    }

    fun configure(title: String, theme: ChatTheme) {
        label.text = title
        label.setTextColor(theme.dateSeparatorText)
        label.background = GradientDrawable().apply {
            setColor(theme.dateSeparatorBackground)
            cornerRadius = context.dpToPx(C.DATE_SEPARATOR_CORNER_DP).toFloat()
        }
    }
}
