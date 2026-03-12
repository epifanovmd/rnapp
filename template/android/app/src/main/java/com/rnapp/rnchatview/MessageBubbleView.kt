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

class MessageBubbleView(
    context: Context,
    private val isMine: Boolean,
) : FrameLayout(context) {

    private val outerRow = LinearLayout(context)
    val bubble = LinearLayout(context)
    private val replyPreview = ReplyPreviewView(context)
    private val contentArea = LinearLayout(context)
    private val textView = TextView(context)
    private val imageView = ImageView(context)
    private val footerRow = LinearLayout(context)
    private val editedLabel = TextView(context)
    private val timeLabel = TextView(context)
    private val statusView = StatusIconView(context)

    var currentBubbleColor: Int = if (isMine) 0xFF3D9EF9.toInt() else 0xFFF0F0F0.toInt()
        private set

    var onReplyTap: ((replyId: String) -> Unit)? = null

    init {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        buildLayout()
    }

    /** Применяет данные сообщения к вью. Вызывается при bind в адаптере. */
    fun configure(message: ChatMessage, resolvedReply: ResolvedReply?, theme: ChatTheme) {
        applyBubbleColors(theme)
        configureReply(resolvedReply, theme)
        configureContent(message, theme)
        configureFooter(message, theme)
        applyMinBubbleWidth(message, resolvedReply)
    }

    /** Сбрасывает состояние при возврате вью в пул. */
    fun prepareForReuse() {
        imageView.setImageBitmap(null)
        ImageLoader.cancel(imageView)
    }

    private fun buildLayout() {
        val sideMargin = context.dpToPx(C.CELL_SIDE_MARGIN_DP)
        val farSideMargin = (context.resources.displayMetrics.widthPixels * (1f - C.BUBBLE_MAX_WIDTH_RATIO)).toInt()
        val vertPad = context.dpToPx(C.CELL_VERTICAL_PADDING_DP)

        outerRow.orientation = LinearLayout.HORIZONTAL
        outerRow.gravity = if (isMine) Gravity.END else Gravity.START
        outerRow.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = vertPad
            bottomMargin = vertPad
        }

        bubble.orientation = LinearLayout.VERTICAL
        bubble.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply {
            if (isMine) { marginStart = farSideMargin; marginEnd = sideMargin }
            else { marginStart = sideMargin; marginEnd = farSideMargin }
        }
        bubble.setPadding(
            context.dpToPx(C.BUBBLE_HORIZONTAL_PADDING_DP),
            context.dpToPx(C.BUBBLE_TOP_PADDING_DP),
            context.dpToPx(C.BUBBLE_HORIZONTAL_PADDING_DP),
            context.dpToPx(C.BUBBLE_BOTTOM_PADDING_DP),
        )
        applyBubbleShape()

        replyPreview.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { bottomMargin = context.dpToPx(C.STACK_SPACING_DP) }

        contentArea.orientation = LinearLayout.VERTICAL
        contentArea.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        )

        textView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
        textView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        )

        imageView.scaleType = ImageView.ScaleType.CENTER_CROP
        imageView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(200f)
        ).apply { topMargin = context.dpToPx(C.STACK_SPACING_DP) }

        contentArea.addView(textView)
        contentArea.addView(imageView)

        footerRow.orientation = LinearLayout.HORIZONTAL
        footerRow.gravity = Gravity.CENTER_VERTICAL or Gravity.END
        footerRow.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = context.dpToPx(C.FOOTER_TOP_SPACING_DP) }

        editedLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.FOOTER_TEXT_SIZE_SP)
        editedLabel.text = "edited"
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
        val radii = floatArrayOf(r, r, r, r, r, r, r, r)
        bubble.background = GradientDrawable().apply { cornerRadii = radii }
    }

    private fun applyBubbleColors(theme: ChatTheme) {
        val color = if (isMine) theme.outgoingBubbleColor else theme.incomingBubbleColor
        currentBubbleColor = color
        (bubble.background as? GradientDrawable)?.setColor(color)
    }

    /** Вычисляет минимальную ширину пузыря чтобы footer не обрезался. */
    private fun computeMinBubbleWidth(message: ChatMessage): Int {
        val paint = android.graphics.Paint().apply {
            textSize = context.spToPx(C.FOOTER_TEXT_SIZE_SP)
        }
        val timeW = paint.measureText(DateHelper.timeString(message.timestamp))
        val statusW: Float = if (message.isMine)
            context.dpToPx(C.STATUS_ICON_SIZE_DP).toFloat() + context.dpToPx(C.FOOTER_SPACING_DP).toFloat()
        else 0f
        val editedW: Float = if (message.isEdited)
            paint.measureText("edited") + context.dpToPx(C.FOOTER_SPACING_DP).toFloat()
        else 0f

        val footerW = timeW + statusW + editedW + context.dpToPx(C.FOOTER_TRAILING_PADDING_DP).toFloat() * 2
        return footerW.toInt() + context.dpToPx(C.BUBBLE_HORIZONTAL_PADDING_DP) * 2
    }

    private fun applyMinBubbleWidth(message: ChatMessage, resolvedReply: ResolvedReply?) {
        if (message.hasImage || resolvedReply is ResolvedReply.Found) return
        val minW = computeMinBubbleWidth(message)
        if (bubble.minimumWidth != minW) bubble.minimumWidth = minW
    }

    private fun configureReply(resolved: ResolvedReply?, theme: ChatTheme) {
        when (resolved) {
            is ResolvedReply.Found -> {
                replyPreview.isVisible = true
                replyPreview.configure(resolved.info, isMine, theme)
                replyPreview.setOnClickListener { onReplyTap?.invoke(resolved.info.replyToId) }
            }
            is ResolvedReply.Deleted -> {
                replyPreview.isVisible = true
                replyPreview.configure(resolved.info, isMine, theme)
                replyPreview.setOnClickListener(null)
            }
            null -> {
                replyPreview.isVisible = false
                replyPreview.setOnClickListener(null)
            }
        }
    }

    private fun configureContent(message: ChatMessage, theme: ChatTheme) {
        val textColor = if (isMine) theme.outgoingTextColor else theme.incomingTextColor
        when (message.content) {
            is MessageContent.Text -> {
                textView.isVisible = true
                imageView.isVisible = false
                textView.text = message.content.textBody
                textView.setTextColor(textColor)
            }
            is MessageContent.Image -> {
                textView.isVisible = false
                imageView.isVisible = true
                loadImage(message.content.imagePayload!!, theme)
            }
            is MessageContent.Mixed -> {
                textView.isVisible = true
                imageView.isVisible = true
                textView.text = message.content.textBody
                textView.setTextColor(textColor)
                loadImage(message.content.imagePayload!!, theme)
            }
        }
    }

    private fun loadImage(payload: MessageContent.ImagePayload, theme: ChatTheme) {
        val w = context.dpToPx(200f)
        if (payload.width != null && payload.width > 0 && payload.height != null && payload.height > 0) {
            val scaledH = (w * (payload.height / payload.width)).toInt()
            imageView.layoutParams = (imageView.layoutParams as LinearLayout.LayoutParams).apply {
                width = w; height = scaledH
            }
        }
        imageView.background = GradientDrawable().apply {
            setColor(if (isMine) theme.outgoingBubbleColor else theme.incomingBubbleColor)
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP).toFloat()
        }
        val url = payload.thumbnailUrl?.takeIf { it.isNotBlank() } ?: payload.url
        ImageLoader.load(context, url, imageView,
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP),
            targetW = w, targetH = w,
        )
    }

    private fun configureFooter(message: ChatMessage, theme: ChatTheme) {
        timeLabel.text = DateHelper.timeString(message.timestamp)
        timeLabel.setTextColor(if (isMine) theme.outgoingTimeColor else theme.incomingTimeColor)
        editedLabel.isVisible = message.isEdited
        editedLabel.setTextColor(if (isMine) theme.outgoingEditedColor else theme.incomingEditedColor)
        statusView.configure(message.status, isMine, theme)
    }
}

class ReplyPreviewView(context: Context) : LinearLayout(context) {

    private val accentBar = View(context)
    private val column = LinearLayout(context)
    private val senderLabel = TextView(context)
    private val bodyLabel = TextView(context)
    private val deletedLabel = TextView(context)

    init {
        orientation = HORIZONTAL
        setPadding(context.dpToPx(8f), context.dpToPx(6f), context.dpToPx(8f), context.dpToPx(6f))
        isClickable = true; isFocusable = true

        accentBar.layoutParams = LayoutParams(context.dpToPx(C.REPLY_BAR_WIDTH_DP), LayoutParams.MATCH_PARENT).apply {
            marginEnd = context.dpToPx(8f)
        }
        accentBar.background = GradientDrawable().apply { cornerRadius = context.dpToPx(2f).toFloat() }

        column.orientation = VERTICAL
        column.layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)

        senderLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12f)
        senderLabel.setTypeface(null, android.graphics.Typeface.BOLD)

        bodyLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12f)
        bodyLabel.maxLines = 2
        bodyLabel.ellipsize = android.text.TextUtils.TruncateAt.END

        deletedLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11f)
        deletedLabel.setTypeface(null, android.graphics.Typeface.ITALIC)
        deletedLabel.visibility = View.GONE

        column.addView(senderLabel)
        column.addView(bodyLabel)
        column.addView(deletedLabel)
        addView(accentBar)
        addView(column)
    }

    /** Применяет данные цитаты к вью. */
    fun configure(info: ReplyDisplayInfo, isMine: Boolean, theme: ChatTheme) {
        val bgColor = if (isMine) theme.outgoingReplyBackground else theme.incomingReplyBackground
        val accentColor = if (isMine) theme.outgoingReplyAccent else theme.incomingReplyAccent
        val senderColor = if (isMine) theme.outgoingReplySender else theme.incomingReplySender
        val textColor = if (isMine) theme.outgoingReplyText else theme.incomingReplyText

        background = GradientDrawable().apply {
            setColor(bgColor)
            cornerRadius = context.dpToPx(C.REPLY_CORNER_RADIUS_DP).toFloat()
        }
        (accentBar.background as? GradientDrawable)?.setColor(accentColor)

        if (info.isDeleted) {
            senderLabel.visibility = View.GONE
            bodyLabel.visibility = View.GONE
            deletedLabel.visibility = View.VISIBLE
            deletedLabel.text = "Message deleted"
            deletedLabel.setTextColor(textColor)
        } else {
            deletedLabel.visibility = View.GONE
            senderLabel.isVisible = !info.senderName.isNullOrBlank()
            senderLabel.text = info.senderName ?: ""
            senderLabel.setTextColor(senderColor)
            bodyLabel.visibility = View.VISIBLE
            bodyLabel.text = when {
                info.text != null -> info.text
                info.hasImage -> "📷 Photo"
                else -> ""
            }
            bodyLabel.setTextColor(textColor)
        }
    }
}

class StatusIconView(context: Context) : TextView(context) {

    init {
        setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 10f)
        gravity = Gravity.CENTER
    }

    /** Обновляет иконку статуса доставки сообщения. */
    fun configure(status: MessageStatus, isMine: Boolean, theme: ChatTheme) {
        if (!isMine) { isVisible = false; return }
        isVisible = true
        val (icon, color) = when (status) {
            MessageStatus.SENDING -> "⏳" to theme.outgoingStatusColor
            MessageStatus.SENT -> "✓" to theme.outgoingStatusColor
            MessageStatus.DELIVERED -> "✓✓" to theme.outgoingStatusColor
            MessageStatus.READ -> "✓✓" to theme.outgoingStatusReadColor
        }
        text = icon
        setTextColor(color)
    }
}

class DateSeparatorView(context: Context) : FrameLayout(context) {

    private val label = TextView(context)

    init {
        layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            context.dpToPx(C.DATE_SEPARATOR_HEIGHT_DP),
        )
        label.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, C.DATE_SEPARATOR_TEXT_SIZE_SP)
        label.gravity = Gravity.CENTER
        label.setPadding(context.dpToPx(14f), context.dpToPx(4f), context.dpToPx(14f), context.dpToPx(4f))
        addView(label, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
    }

    /** Применяет заголовок и тему к разделителю дат. */
    fun configure(title: String, theme: ChatTheme) {
        label.text = title
        label.setTextColor(theme.dateSeparatorText)
        label.background = GradientDrawable().apply {
            setColor(theme.dateSeparatorBackground)
            cornerRadius = context.dpToPx(C.DATE_SEPARATOR_CORNER_DP).toFloat()
        }
    }
}
