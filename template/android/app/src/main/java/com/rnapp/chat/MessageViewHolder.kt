package com.rnapp.chat.viewholder

import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.isVisible
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.adapter.ChatAdapter
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.model.MessageStatus
import com.rnapp.chat.model.ReplyDisplayInfo
import com.rnapp.chat.model.ResolvedReply
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.DateHelper
import com.rnapp.chat.utils.ImageLoader
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF
import com.rnapp.chat.utils.spToPx

/**
 * ViewHolder пузыря сообщения.
 *
 * Структура View (создаётся программно в create()):
 *
 *  FrameLayout (root, MATCH_PARENT × WRAP_CONTENT)
 *   └─ LinearLayout (bubbleContainer, horizontal, gravity=start|end)
 *       └─ LinearLayout (bubble, vertical, maxWidth = 78% экрана)
 *           ├─ [SenderName] TextView   (только для входящих в групповом чате)
 *           ├─ [ReplyBlock] LinearLayout (цитата, если replyTo != null)
 *           │    ├─ View (accent line, 3dp wide)
 *           │    └─ LinearLayout (vertical: sender + text)
 *           ├─ [ImageView]  (картинка, если hasImage)
 *           ├─ [TextView]   (текст сообщения, если hasText)
 *           └─ LinearLayout (footer: edited? + time + status?)
 *
 * Bubble corners (как Telegram):
 *  • Исходящие: все 16dp, кроме bottom-right → 4dp (острый угол у края)
 *  • Входящие:  все 16dp, кроме bottom-left  → 4dp (острый угол у края)
 *
 * ResolvedReply:
 *  Цитата резолвится через messageIndex при каждом bind().
 *  Это гарантирует актуальность данных после редактирования оригинала.
 */
class MessageViewHolder private constructor(
    private val root: FrameLayout,
    private val bubbleContainer: LinearLayout,
    private val bubble: LinearLayout,
    private val senderNameTv: TextView,
    private val replyBlock: LinearLayout,
    private val replyAccent: View,
    private val replySenderTv: TextView,
    private val replyTextTv: TextView,
    private val messageImage: ImageView,
    private val messageText: TextView,
    private val footer: LinearLayout,
    private val editedLabel: TextView,
    private val timeLabel: TextView,
    private val statusIcon: ImageView,
    private val outgoing: Boolean,
    private val sizeCache: ItemSizeCache,
    private val callbacks: ChatAdapter.ChatAdapterCallbacks,
) : RecyclerView.ViewHolder(root) {

    private var currentMessageId: String? = null
    private var currentReplyToId: String? = null

    init {
        // Клики на весь пузырь
        bubble.setOnClickListener {
            currentMessageId?.let(callbacks::onMessageClick)
        }
        bubble.setOnLongClickListener {
            currentMessageId?.let { id -> callbacks.onMessageLongClick(id, bubble) }
            true
        }
        // Клик на цитату → скролл к оригиналу
        replyBlock.setOnClickListener {
            currentReplyToId?.let(callbacks::onReplyClick)
        }
    }

    // ─── Public bind ──────────────────────────────────────────────────────────

    fun bind(
        message: ChatMessage,
        messageIndex: Map<String, ChatMessage>,
        theme: ChatTheme,
    ) {
        currentMessageId = message.id
        currentReplyToId = message.replyTo?.id

        bindSenderName(message)
        bindReply(message, messageIndex)
        bindImage(message)
        bindText(message)
        bindFooter(message)
        applyTheme(theme)
    }

    // ─── Partial bind (payload-based) ─────────────────────────────────────────

    fun bindStatus(status: MessageStatus) {
        if (!outgoing) return
        applyStatusIcon(status)
    }

    fun bindEdited(isEdited: Boolean) {
        editedLabel.isVisible = isEdited
    }

    fun applyTheme(theme: ChatTheme) {
        applyBubbleBackground(theme)
        applyColors(theme)
    }

    // ─── Private bind helpers ─────────────────────────────────────────────────

    private fun bindSenderName(message: ChatMessage) {
        // Имя отправителя показываем только для входящих (групповые чаты)
        if (!outgoing && !message.senderName.isNullOrBlank()) {
            senderNameTv.isVisible = true
            senderNameTv.text = message.senderName
        } else {
            senderNameTv.isVisible = false
        }
    }

    private fun bindReply(message: ChatMessage, messageIndex: Map<String, ChatMessage>) {
        val replyRef = message.replyTo
        if (replyRef == null) {
            replyBlock.isVisible = false
            return
        }

        replyBlock.isVisible = true

        // Резолвим цитату через messageIndex для актуальных данных оригинала
        val resolved = when (val original = messageIndex[replyRef.id]) {
            null -> ResolvedReply.Deleted
            else -> ResolvedReply.Found(ReplyDisplayInfo.fromMessage(original))
        }

        when (resolved) {
            is ResolvedReply.Found -> {
                val info = resolved.info
                replySenderTv.text = info.senderName ?: ""
                replyTextTv.text = when {
                    !info.text.isNullOrBlank() -> info.text
                    info.hasImage              -> "📷 Photo"
                    else                       -> ""
                }
            }
            is ResolvedReply.Deleted -> {
                // Fallback — используем снапшот из ChatReplyRef
                replySenderTv.text = replyRef.senderName ?: ""
                replyTextTv.text = when {
                    !replyRef.text.isNullOrBlank()  -> replyRef.text
                    replyRef.hasImages == true       -> "📷 Photo"
                    else                             -> "Message deleted"
                }
            }
        }
    }

    private fun bindImage(message: ChatMessage) {
        val image = message.images?.firstOrNull()
        if (image != null) {
            messageImage.isVisible = true
            val ctx = root.context
            // Используем реальные размеры из метаданных, иначе fallback на ratio
            val maxW = (root.resources.displayMetrics.widthPixels * ChatLayoutConstants.BUBBLE_MAX_WIDTH_RATIO).toInt()
            val imgH = if (image.width != null && image.height != null && image.width > 0) {
                (maxW * (image.height / image.width)).toInt()
            } else {
                (maxW * ChatLayoutConstants.IMAGE_ASPECT_RATIO).toInt()
            }
            messageImage.layoutParams = (messageImage.layoutParams as LinearLayout.LayoutParams).also {
                it.width  = ViewGroup.LayoutParams.MATCH_PARENT
                it.height = imgH
            }
            val cornerPx = ChatLayoutConstants.IMAGE_CORNER_RADIUS_DP.dpToPxF(ctx)
            ImageLoader.load(url = image.thumbnailUrl ?: image.url, target = messageImage, cornerRadiusPx = cornerPx)
        } else {
            messageImage.isVisible = false
            ImageLoader.cancelLoad(messageImage)
        }
    }

    private fun bindText(message: ChatMessage) {
        if (message.hasText) {
            messageText.isVisible = true
            messageText.text = message.text
        } else {
            messageText.isVisible = false
        }
    }

    private fun bindFooter(message: ChatMessage) {
        editedLabel.isVisible = message.isEdited
        timeLabel.text = DateHelper.timeString(message.timestamp)
        applyStatusIcon(message.status)
    }

    private fun applyStatusIcon(status: MessageStatus) {
        if (!outgoing) {
            statusIcon.isVisible = false
            return
        }
        statusIcon.isVisible = true
        // В реальном проекте замените на векторные drawable ресурсы из res/drawable
        // Здесь используются системные ресурсы как placeholder
        val (iconRes, useReadColor) = when (status) {
            MessageStatus.SENDING   -> android.R.drawable.ic_popup_sync to false
            MessageStatus.SENT      -> android.R.drawable.checkbox_on_background to false
            MessageStatus.DELIVERED -> android.R.drawable.checkbox_on_background to false
            MessageStatus.READ      -> android.R.drawable.checkbox_on_background to true
        }
        statusIcon.setImageResource(iconRes)
        // Цвет фильтра задаётся в applyColors() через theme
        statusIcon.tag = useReadColor
    }

    private fun applyBubbleBackground(theme: ChatTheme) {
        val ctx    = bubble.context
        val r      = ChatLayoutConstants.BUBBLE_CORNER_RADIUS_DP.dpToPxF(ctx)
        val rTail  = ChatLayoutConstants.BUBBLE_TAIL_CORNER_DP.dpToPxF(ctx)

        // Telegram-style corners:
        // Исходящие: острый bottom-right (угол у правого края)
        // Входящие:  острый bottom-left  (угол у левого края)
        //
        // GradientDrawable.cornerRadii:
        //   [top-left-x, top-left-y, top-right-x, top-right-y,
        //    bottom-right-x, bottom-right-y, bottom-left-x, bottom-left-y]
        val radii = if (outgoing) {
            floatArrayOf(r, r, r, r, rTail, rTail, r, r)   // bottom-right острый
        } else {
            floatArrayOf(r, r, r, r, r, r, rTail, rTail)   // bottom-left острый
        }

        val bubbleColor = if (outgoing) theme.outgoingBubbleColor else theme.incomingBubbleColor
        bubble.background = GradientDrawable().apply {
            shape       = GradientDrawable.RECTANGLE
            cornerRadii = radii
            setColor(bubbleColor)
        }

        // Reply block background с меньшим радиусом
        val replyBg = if (outgoing) theme.outgoingReplyBackground else theme.incomingReplyBackground
        replyBlock.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = r / 2f
            setColor(replyBg)
        }
    }

    private fun applyColors(theme: ChatTheme) {
        // Текст
        messageText.setTextColor(if (outgoing) theme.outgoingTextColor else theme.incomingTextColor)

        // Footer
        timeLabel.setTextColor(if (outgoing) theme.outgoingTimeColor else theme.incomingTimeColor)
        editedLabel.setTextColor(if (outgoing) theme.outgoingEditedColor else theme.incomingEditedColor)

        // Status icon color
        if (outgoing && statusIcon.isVisible) {
            val useReadColor = statusIcon.tag as? Boolean ?: false
            statusIcon.setColorFilter(
                if (useReadColor) theme.outgoingStatusReadColor else theme.outgoingStatusColor
            )
        }

        // Reply block
        replyAccent.setBackgroundColor(
            if (outgoing) theme.outgoingReplyAccent else theme.incomingReplyAccent
        )
        replySenderTv.setTextColor(if (outgoing) theme.outgoingReplySender else theme.incomingReplySender)
        replyTextTv.setTextColor(if (outgoing) theme.outgoingReplyText else theme.incomingReplyText)

        // Sender name (только incoming)
        senderNameTv.setTextColor(theme.incomingReplySender)

        // Bubble gravity
        bubbleContainer.gravity = if (outgoing) Gravity.END else Gravity.START
    }

    // ─── Factory ──────────────────────────────────────────────────────────────

    companion object {

        fun create(
            parent: ViewGroup,
            theme: ChatTheme,
            sizeCache: ItemSizeCache,
            callbacks: ChatAdapter.ChatAdapterCallbacks,
            outgoing: Boolean,
        ): MessageViewHolder {
            val ctx = parent.context

            fun dp(v: Float): Int = v.dpToPx(ctx)
            fun dpF(v: Float): Float = v.dpToPxF(ctx)
            fun sp(v: Float): Float = v.spToPx(ctx)

            val screenW = parent.resources.displayMetrics.widthPixels
            val maxBubbleW = (screenW * ChatLayoutConstants.BUBBLE_MAX_WIDTH_RATIO).toInt()

            // ── Sender name (входящие, групповые) ──────────────────────────────
            val senderNameTv = TextView(ctx).apply {
                textSize = ChatLayoutConstants.SENDER_TEXT_SIZE_SP
                setTypeface(null, Typeface.BOLD)
                maxLines = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = dp(2f) }
                isVisible = false
            }

            // ── Reply block ────────────────────────────────────────────────────
            val replyAccent = View(ctx).apply {
                layoutParams = LinearLayout.LayoutParams(
                    dp(ChatLayoutConstants.REPLY_ACCENT_WIDTH_DP),
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            }
            val replySenderTv = TextView(ctx).apply {
                textSize = ChatLayoutConstants.REPLY_SENDER_TEXT_SIZE_SP
                setTypeface(null, Typeface.BOLD)
                maxLines = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }
            val replyTextTv = TextView(ctx).apply {
                textSize = ChatLayoutConstants.REPLY_TEXT_SIZE_SP
                maxLines = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }
            val replyTextsCol = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginStart = dp(ChatLayoutConstants.REPLY_INNER_PADDING_DP)
                }
                addView(replySenderTv)
                addView(replyTextTv)
            }
            val replyBlock = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity     = Gravity.CENTER_VERTICAL
                val h   = dp(ChatLayoutConstants.REPLY_BLOCK_HEIGHT_DP)
                val pad = dp(ChatLayoutConstants.REPLY_INNER_PADDING_DP)
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, h
                ).apply { bottomMargin = dp(ChatLayoutConstants.STACK_SPACING_DP) }
                setPadding(pad, pad / 2, pad, pad / 2)
                isClickable = true
                isFocusable = true
                addView(replyAccent)
                addView(replyTextsCol)
                isVisible = false
            }

            // ── Image ──────────────────────────────────────────────────────────
            val messageImage = ImageView(ctx).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dp(ChatLayoutConstants.IMAGE_ASPECT_RATIO * 200f)
                ).apply { bottomMargin = dp(ChatLayoutConstants.STACK_SPACING_DP) }
                clipToOutline = true
                isVisible = false
            }

            // ── Text ───────────────────────────────────────────────────────────
            val messageText = TextView(ctx).apply {
                textSize = ChatLayoutConstants.MESSAGE_TEXT_SIZE_SP
                setLineSpacing(dpF(ChatLayoutConstants.LINE_SPACING_DP), 1f)
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = dp(ChatLayoutConstants.FOOTER_TOP_SPACING_DP) }
            }

            // ── Footer ─────────────────────────────────────────────────────────
            val editedLabel = TextView(ctx).apply {
                textSize = ChatLayoutConstants.FOOTER_TEXT_SIZE_SP
                text     = "edited"
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { marginEnd = dp(ChatLayoutConstants.FOOTER_INTERNAL_SPACING_DP) }
                isVisible = false
            }
            val timeLabel = TextView(ctx).apply {
                textSize = ChatLayoutConstants.FOOTER_TEXT_SIZE_SP
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { marginEnd = dp(ChatLayoutConstants.FOOTER_INTERNAL_SPACING_DP) }
            }
            val statusIcon = ImageView(ctx).apply {
                val s = dp(ChatLayoutConstants.STATUS_ICON_SIZE_DP)
                layoutParams = LinearLayout.LayoutParams(s, s)
                isVisible = outgoing
            }
            val footer = LinearLayout(ctx).apply {
                orientation  = LinearLayout.HORIZONTAL
                gravity      = Gravity.CENTER_VERTICAL or Gravity.END
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                )
                addView(editedLabel)
                addView(timeLabel)
                if (outgoing) addView(statusIcon)
            }

            // ── Bubble ─────────────────────────────────────────────────────────
            val hPad = dp(ChatLayoutConstants.BUBBLE_HORIZONTAL_PAD_DP)
            val bubble = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(
                    hPad, dp(ChatLayoutConstants.BUBBLE_TOP_PAD_DP),
                    hPad, dp(ChatLayoutConstants.BUBBLE_BOTTOM_PAD_DP)
                )
                // WRAP_CONTENT с ограничением maxWidth через FrameLayout trick:
                // Устанавливаем LayoutParams.width = maxBubbleW но clipToPadding = false.
                // Пузырь не будет растягиваться шире maxBubbleW.
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { width = maxBubbleW }
                addView(senderNameTv)
                addView(replyBlock)
                addView(messageImage)
                addView(messageText)
                addView(footer)
                isClickable = true
                isFocusable = true
                // Ripple-эффект на пузыре
                val outValue = android.util.TypedValue()
                ctx.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
                foreground = ctx.getDrawable(outValue.resourceId)
            }

            // ── Bubble container ───────────────────────────────────────────────
            val sideMargin = dp(ChatLayoutConstants.CELL_SIDE_MARGIN_DP)
            val bubbleContainer = LinearLayout(ctx).apply {
                orientation  = LinearLayout.HORIZONTAL
                gravity      = if (outgoing) Gravity.END else Gravity.START
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                )
                bubble.layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    if (outgoing) marginEnd = sideMargin else marginStart = sideMargin
                }
                addView(bubble)
            }

            // ── Root ───────────────────────────────────────────────────────────
            val vPad = dp(ChatLayoutConstants.CELL_VERTICAL_PADDING_DP)
            val root = FrameLayout(ctx).apply {
                layoutParams = RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin    = vPad
                    bottomMargin = vPad
                }
                addView(bubbleContainer)
            }

            return MessageViewHolder(
                root, bubbleContainer, bubble,
                senderNameTv,
                replyBlock, replyAccent, replySenderTv, replyTextTv,
                messageImage, messageText,
                footer, editedLabel, timeLabel, statusIcon,
                outgoing, sizeCache, callbacks,
            )
        }
    }
}
