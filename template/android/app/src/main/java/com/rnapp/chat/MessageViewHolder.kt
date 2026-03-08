package com.rnapp.chat.viewholder

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.isVisible
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.adapter.ChatAdapter
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.ImageLoader
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.utils.DateHelper
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.spToPx

/**
 * ViewHolder пузыря сообщения.
 *
 * Структура View:
 *  FrameLayout (root, MATCH_PARENT)
 *   └─ LinearLayout (bubble container, gravity=start|end)
 *       └─ LinearLayout (bubble, vertical)
 *           ├─ [ReplyBlock] LinearLayout (цитата)
 *           ├─ [ImageView]  (картинка)
 *           ├─ [TextView]   (текст сообщения)
 *           └─ LinearLayout (footer: edited + time + status)
 */
@SuppressLint("ClickableViewAccessibility")
class MessageViewHolder private constructor(
    private val root: FrameLayout,
    private val bubbleContainer: LinearLayout,
    private val bubble: LinearLayout,
    private val replyBlock: LinearLayout,
    private val replyAccent: View,
    private val replySender: TextView,
    private val replyText: TextView,
    private val messageImage: ImageView,
    private val messageText: TextView,
    private val footer: LinearLayout,
    private val editedLabel: TextView,
    private val timeLabel: TextView,
    private val statusIcon: ImageView,
    private var theme: ChatTheme,
    private val sizeCache: ItemSizeCache,
    private val callbacks: ChatAdapter.ChatAdapterCallbacks,
    private val outgoing: Boolean,
) : RecyclerView.ViewHolder(root) {

    private var currentMessageId: String? = null

    private var currentReplyToId: String? = null

    init {
        bubble.isClickable = true
        bubble.isFocusable = true
        bubble.setOnClickListener { currentMessageId?.let(callbacks::onMessageClick) }
        bubble.setOnLongClickListener {
            currentMessageId?.let { id -> callbacks.onMessageLongClick(id, this) }
            true
        }
        replyBlock.setOnClickListener {
            currentReplyToId?.let(callbacks::onReplyClick)
        }
    }

    fun bind(message: ChatMessage) {
        currentMessageId = message.id
        currentReplyToId = message.replyTo?.id

        // ── Reply ──────────────────────────────────────────────────────────
        if (message.replyTo != null) {
            replyBlock.isVisible = true
            replySender.text = message.replyTo.senderName ?: ""
            replyText.text   = when {
                !message.replyTo.text.isNullOrBlank() -> message.replyTo.text
                message.replyTo.hasImages == true      -> "📷 Photo"
                else                                   -> ""
            }
        } else {
            replyBlock.isVisible = false
        }

        // ── Image ──────────────────────────────────────────────────────────
        val image = message.images?.firstOrNull()
        if (image != null) {
            messageImage.isVisible = true
            val ctx    = root.context
            val width  = (root.resources.displayMetrics.widthPixels * ChatLayoutConstants.BUBBLE_MAX_WIDTH_RATIO).toInt()
            val height = (width * ChatLayoutConstants.IMAGE_ASPECT_RATIO).toInt()
            messageImage.layoutParams = LinearLayout.LayoutParams(width, height)
            ImageLoader.load(
                url           = image.url,
                target        = messageImage,
                cornerRadiusPx = ChatLayoutConstants.IMAGE_CORNER_RADIUS_DP.dpToPx(ctx).toFloat(),
            )
        } else {
            messageImage.isVisible = false
            ImageLoader.cancelLoad(messageImage)
        }

        // ── Text ───────────────────────────────────────────────────────────
        if (!message.text.isNullOrBlank()) {
            messageText.isVisible = true
            messageText.text = message.text
        } else {
            messageText.isVisible = false
        }

        // ── Footer ─────────────────────────────────────────────────────────
        editedLabel.isVisible = message.isEdited
        timeLabel.text = DateHelper.timeString(message.timestamp)
        bindStatus(message.status)

        applyTheme()

        // ── Cache height ───────────────────────────────────────────────────
        // После layout RecyclerView сохраняет высоту
        root.post {
            if (root.height > 0) sizeCache.put(message.id, root.height)
        }
    }

    private fun bindStatus(status: String?) {
        if (!outgoing) { statusIcon.isVisible = false; return }
        statusIcon.isVisible = true
        val iconRes = when (status) {
            "sending"   -> ICON_CLOCK
            "sent"      -> ICON_CHECK
            "delivered" -> ICON_DOUBLE_CHECK
            "read"      -> ICON_DOUBLE_CHECK_BLUE
            else        -> ICON_CHECK
        }
        statusIcon.setImageResource(iconRes)
        statusIcon.setColorFilter(
            if (status == "read") theme.outgoingStatusReadColor else theme.outgoingStatusColor
        )
    }

    private fun applyTheme() {
        val ctx = root.context

        val bubbleColor = if (outgoing) theme.outgoingBubbleColor else theme.incomingBubbleColor
        val r           = ChatLayoutConstants.BUBBLE_CORNER_RADIUS_DP.dpToPx(ctx).toFloat()
        val rTail       = ChatLayoutConstants.BUBBLE_TAIL_CORNER_DP.dpToPx(ctx).toFloat()

        // Скруглённый пузырь: острый угол у края экрана
        val radii = if (outgoing)
            floatArrayOf(r, r, rTail, rTail, r, r, r, r)   // top-right острый
        else
            floatArrayOf(rTail, rTail, r, r, r, r, r, r)   // top-left острый

        bubble.background = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadii = radii
            setColor(bubbleColor)
        }

        messageText.setTextColor(if (outgoing) theme.outgoingTextColor else theme.incomingTextColor)
        timeLabel.setTextColor(if (outgoing) theme.outgoingTimeColor else theme.incomingTimeColor)
        editedLabel.setTextColor(if (outgoing) theme.outgoingEditedColor else theme.incomingEditedColor)

        // Reply block
        val replyBg    = if (outgoing) theme.outgoingReplyBackground else theme.incomingReplyBackground
        val replyAcc   = if (outgoing) theme.outgoingReplyAccent else theme.incomingReplyAccent
        val replySendC = if (outgoing) theme.outgoingReplySender else theme.incomingReplySender
        val replyTextC = if (outgoing) theme.outgoingReplyText else theme.incomingReplyText

        replyBlock.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = r / 2
            setColor(replyBg)
        }
        replyAccent.setBackgroundColor(replyAcc)
        replySender.setTextColor(replySendC)
        replyText.setTextColor(replyTextC)

        // Gravity
        bubbleContainer.gravity = if (outgoing) Gravity.END else Gravity.START
    }

    companion object {
        // Заглушки — замените на реальные drawable ресурсы
        const val ICON_CLOCK            = android.R.drawable.ic_menu_recent_history
        const val ICON_CHECK            = android.R.drawable.checkbox_on_background
        const val ICON_DOUBLE_CHECK     = android.R.drawable.checkbox_on_background
        const val ICON_DOUBLE_CHECK_BLUE = android.R.drawable.checkbox_on_background

        fun create(
            parent: ViewGroup,
            theme: ChatTheme,
            sizeCache: ItemSizeCache,
            callbacks: ChatAdapter.ChatAdapterCallbacks,
            outgoing: Boolean,
        ): MessageViewHolder {
            val ctx = parent.context

            // ── Params helpers ─────────────────────────────────────────────
            fun dp(v: Float) = v.dpToPx(ctx)
            fun sp(v: Float) = v.spToPx(ctx)

            // ── Reply block ────────────────────────────────────────────────
            val replyAccent = View(ctx).apply {
                layoutParams = LinearLayout.LayoutParams(dp(ChatLayoutConstants.REPLY_ACCENT_WIDTH_DP), ViewGroup.LayoutParams.MATCH_PARENT)
            }
            val replySender = TextView(ctx).apply {
                textSize  = ChatLayoutConstants.REPLY_SENDER_TEXT_SIZE_SP
                setTypeface(null, Typeface.BOLD)
                maxLines  = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            }
            val replyTextView = TextView(ctx).apply {
                textSize  = ChatLayoutConstants.REPLY_TEXT_SIZE_SP
                maxLines  = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            }
            val replyTexts = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginStart = dp(ChatLayoutConstants.REPLY_INNER_PADDING_DP)
                }
                addView(replySender)
                addView(replyTextView)
            }
            val replyBlock = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                val h = dp(ChatLayoutConstants.REPLY_BLOCK_HEIGHT_DP)
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, h).apply {
                    bottomMargin = dp(ChatLayoutConstants.STACK_SPACING_DP)
                }
                val pad = dp(ChatLayoutConstants.REPLY_INNER_PADDING_DP)
                setPadding(pad, pad, pad, pad)
                addView(replyAccent)
                addView(replyTexts)
                isClickable = true
                isFocusable = true
            }

            // ── Image ──────────────────────────────────────────────────────
            val messageImage = ImageView(ctx).apply {
                scaleType    = ImageView.ScaleType.CENTER_CROP
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dp(ChatLayoutConstants.IMAGE_ASPECT_RATIO * 200f)
                ).apply { bottomMargin = dp(ChatLayoutConstants.STACK_SPACING_DP) }
            }

            // ── Text ───────────────────────────────────────────────────────
            val messageText = TextView(ctx).apply {
                textSize     = ChatLayoutConstants.MESSAGE_TEXT_SIZE_SP
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(ChatLayoutConstants.FOOTER_TOP_SPACING_DP)
                }
            }

            // ── Footer ─────────────────────────────────────────────────────
            val editedLabel = TextView(ctx).apply {
                textSize = ChatLayoutConstants.FOOTER_TEXT_SIZE_SP
                text     = "edited"
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { marginEnd = dp(ChatLayoutConstants.FOOTER_INTERNAL_SPACING_DP) }
            }
            val timeLabel = TextView(ctx).apply {
                textSize = ChatLayoutConstants.FOOTER_TEXT_SIZE_SP
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { marginEnd = dp(ChatLayoutConstants.FOOTER_INTERNAL_SPACING_DP) }
            }
            val statusIcon = ImageView(ctx).apply {
                val s = dp(ChatLayoutConstants.STATUS_ICON_SIZE_DP)
                layoutParams = LinearLayout.LayoutParams(s, s)
            }
            val footer = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity     = Gravity.CENTER_VERTICAL or Gravity.END
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                if (!outgoing) statusIcon.isVisible = false
                addView(editedLabel)
                addView(timeLabel)
                if (outgoing) addView(statusIcon)
            }

            // ── Bubble ─────────────────────────────────────────────────────
            val hPad = dp(ChatLayoutConstants.BUBBLE_HORIZONTAL_PAD_DP)
            val bubble = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                val bTopPad = dp(ChatLayoutConstants.BUBBLE_TOP_PAD_DP)
                val bBotPad = dp(ChatLayoutConstants.BUBBLE_BOTTOM_PAD_DP)
                setPadding(hPad, bTopPad, hPad, bBotPad)
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    val maxW = (parent.resources.displayMetrics.widthPixels * ChatLayoutConstants.BUBBLE_MAX_WIDTH_RATIO).toInt()
                    width = maxW
                }
                addView(replyBlock)
                addView(messageImage)
                addView(messageText)
                addView(footer)
            }

            // ── Bubble container ───────────────────────────────────────────
            val margin = dp(ChatLayoutConstants.CELL_SIDE_MARGIN_DP)
            val bubbleContainer = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity     = if (outgoing) Gravity.END else Gravity.START
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                val lp = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    if (outgoing) marginEnd = margin else marginStart = margin
                }
                bubble.layoutParams = lp
                addView(bubble)
            }

            // ── Root ───────────────────────────────────────────────────────
            val vPad = dp(ChatLayoutConstants.CELL_VERTICAL_PADDING_DP)
            val root = FrameLayout(ctx).apply {
                layoutParams = RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin    = vPad
                    bottomMargin = vPad
                }
                addView(bubbleContainer)
            }

            return MessageViewHolder(
                root, bubbleContainer, bubble,
                replyBlock, replyAccent, replySender, replyTextView,
                messageImage, messageText,
                footer, editedLabel, timeLabel, statusIcon,
                theme, sizeCache, callbacks, outgoing,
            )
        }
    }
}
