package com.rnapp.rnchatview

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.TypedValue
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

    // Video overlay views
    private val videoOverlay = FrameLayout(context)
    private val playButton = ImageView(context)
    private val durationBg = FrameLayout(context)
    private val durationLabel = TextView(context)

    // Poll views
    private val pollContainer = LinearLayout(context)
    private val pollQuestionLabel = TextView(context)
    private val pollVotesLabel = TextView(context)
    private var pollOptionViews: MutableList<PollOptionRowView> = mutableListOf()

    // File views
    private val fileContainer = LinearLayout(context)
    private val fileIcon = ImageView(context)
    private val fileNameLabel = TextView(context)
    private val fileSizeLabel = TextView(context)

    // Voice views
    private val voiceContainer = LinearLayout(context)
    private val voicePlayButton = ImageView(context)
    private val voiceWaveform = View(context)  // placeholder for waveform
    private val voiceDurationLabel = TextView(context)

    // Forwarded header
    private val forwardedLabel = TextView(context)

    // Reactions row
    private val reactionsContainer = LinearLayout(context)

    var currentBubbleColor: Int = if (isMine) 0xFF3D9EF9.toInt() else 0xFFF0F0F0.toInt()
        private set

    var isEmojiOnly: Boolean = false
        private set

    var onReplyTap: ((replyId: String) -> Unit)? = null
    var onVideoTap: ((videoUrl: String) -> Unit)? = null
    var onPollOptionTap: ((pollId: String, optionId: String) -> Unit)? = null
    var onFileTap: ((fileUrl: String, fileName: String) -> Unit)? = null

    init {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        buildLayout()
    }

    fun configure(message: ChatMessage, resolvedReply: ResolvedReply?, theme: ChatTheme) {
        // Emoji-only detection
        isEmojiOnly = message.content is MessageContent.Text
                && resolvedReply == null
                && message.forwardedFrom == null
                && EmojiHelper.emojiOnlyCount(message.content.textBody ?: "") != null

        applyBubbleColors(theme)
        configureForwarded(message, theme)
        configureReply(resolvedReply, theme)
        configureContent(message, theme)
        configureReactions(message, theme)
        configureFooter(message, theme)
        if (!isEmojiOnly) applyMinBubbleWidth(message, resolvedReply)
    }

    private fun configureForwarded(message: ChatMessage, theme: ChatTheme) {
        val fwd = message.forwardedFrom
        if (fwd != null) {
            forwardedLabel.isVisible = true
            forwardedLabel.text = "↗ Forwarded from $fwd"
            forwardedLabel.setTextColor(
                if (isMine) theme.outgoingReplyAccent else theme.incomingReplyAccent
            )
        } else {
            forwardedLabel.isVisible = false
        }
    }

    private fun configureReactions(message: ChatMessage, theme: ChatTheme) {
        reactionsContainer.removeAllViews()
        if (message.reactions.isEmpty()) {
            reactionsContainer.isVisible = false
            return
        }
        reactionsContainer.isVisible = true

        for (reaction in message.reactions) {
            val chip = TextView(context).apply {
                text = "${reaction.emoji} ${reaction.count}"
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                setPadding(C.dpToPx(6), C.dpToPx(3), C.dpToPx(6), C.dpToPx(3))

                val bg = GradientDrawable().apply {
                    cornerRadius = C.dpToPx(13).toFloat()
                    if (reaction.isMine) {
                        setColor(adjustAlpha(
                            if (isMine) theme.outgoingReplyAccent else theme.incomingReplyAccent,
                            0.2f
                        ))
                    } else {
                        setColor(adjustAlpha(
                            if (isMine) Color.WHITE else Color.BLACK,
                            0.08f
                        ))
                    }
                }
                background = bg
                setTextColor(if (isMine) theme.outgoingTextColor else theme.incomingTextColor)
            }
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { marginEnd = C.dpToPx(4) }
            reactionsContainer.addView(chip, lp)
        }
    }

    private fun adjustAlpha(color: Int, factor: Float): Int {
        val alpha = (Color.alpha(color) * factor).toInt().coerceIn(0, 255)
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
    }

    fun prepareForReuse() {
        imageView.setImageBitmap(null)
        ImageLoader.cancel(imageView)
        onVideoTap = null
        onPollOptionTap = null
        onFileTap = null
        isEmojiOnly = false
    }

    private fun buildLayout() {
        val sideMargin = context.dpToPx(C.CELL_SIDE_MARGIN_DP)
        val farSideMargin = (context.resources.displayMetrics.widthPixels * (1f - C.BUBBLE_MAX_WIDTH_RATIO)).toInt()
        val vertPad = context.dpToPx(C.CELL_VERTICAL_PADDING_DP)

        outerRow.orientation = LinearLayout.HORIZONTAL
        outerRow.gravity = if (isMine) Gravity.END else Gravity.START
        outerRow.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = vertPad; bottomMargin = vertPad
        }

        bubble.orientation = LinearLayout.VERTICAL
        bubble.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT,
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
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { bottomMargin = context.dpToPx(C.STACK_SPACING_DP) }

        contentArea.orientation = LinearLayout.VERTICAL
        contentArea.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT,
        )

        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
        textView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        )

        imageView.scaleType = ImageView.ScaleType.CENTER_CROP
        imageView.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(200f)
        ).apply { topMargin = context.dpToPx(C.STACK_SPACING_DP) }

        // Video overlay
        buildVideoOverlay()

        // Poll container
        buildPollContainer()

        // File container
        buildFileContainer()

        // Voice container
        buildVoiceContainer()

        contentArea.addView(textView)
        contentArea.addView(imageView)
        contentArea.addView(videoOverlay)
        contentArea.addView(voiceContainer)
        contentArea.addView(pollContainer)
        contentArea.addView(fileContainer)

        footerRow.orientation = LinearLayout.HORIZONTAL
        footerRow.gravity = Gravity.CENTER_VERTICAL or Gravity.END
        footerRow.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = context.dpToPx(C.FOOTER_TOP_SPACING_DP) }

        editedLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.FOOTER_TEXT_SIZE_SP)
        editedLabel.text = "edited"
        editedLabel.visibility = View.GONE
        editedLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginEnd = context.dpToPx(C.FOOTER_SPACING_DP) }

        timeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.FOOTER_TEXT_SIZE_SP)
        timeLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginEnd = context.dpToPx(C.FOOTER_SPACING_DP) }

        statusView.layoutParams = LinearLayout.LayoutParams(
            context.dpToPx(C.STATUS_ICON_SIZE_DP), context.dpToPx(C.STATUS_ICON_SIZE_DP)
        )

        footerRow.addView(editedLabel)
        footerRow.addView(timeLabel)
        footerRow.addView(statusView)

        // Forwarded label
        forwardedLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        forwardedLabel.isVisible = false
        forwardedLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = context.dpToPx(C.STACK_SPACING_DP) }

        // Reactions container
        reactionsContainer.orientation = LinearLayout.HORIZONTAL
        reactionsContainer.isVisible = false
        reactionsContainer.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = context.dpToPx(C.STACK_SPACING_DP) }

        bubble.addView(forwardedLabel)
        bubble.addView(replyPreview)
        bubble.addView(contentArea)
        bubble.addView(reactionsContainer)
        bubble.addView(footerRow)

        outerRow.addView(bubble)
        addView(outerRow)
    }

    private fun buildVideoOverlay() {
        videoOverlay.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(200f)
        ).apply { topMargin = context.dpToPx(C.STACK_SPACING_DP) }
        videoOverlay.isVisible = false

        val thumbnailIv = ImageView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            layoutParams = FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            tag = "video_thumb"
        }
        videoOverlay.addView(thumbnailIv)

        val playSize = context.dpToPx(C.VIDEO_PLAY_BUTTON_SIZE_DP)
        playButton.setImageResource(android.R.drawable.ic_media_play)
        playButton.setColorFilter(Color.WHITE)
        playButton.alpha = 0.9f
        playButton.layoutParams = FrameLayout.LayoutParams(playSize, playSize, Gravity.CENTER)
        videoOverlay.addView(playButton)

        durationLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.VIDEO_DURATION_TEXT_SIZE_SP)
        durationLabel.setTextColor(Color.WHITE)
        durationLabel.gravity = Gravity.CENTER
        val padH = context.dpToPx(C.VIDEO_DURATION_PAD_H_DP)
        val padV = context.dpToPx(C.VIDEO_DURATION_PAD_V_DP)
        durationLabel.setPadding(padH, padV, padH, padV)

        durationBg.background = GradientDrawable().apply {
            setColor(Color.argb(140, 0, 0, 0))
            cornerRadius = context.dpToPx(C.VIDEO_DURATION_CORNER_DP).toFloat()
        }
        durationBg.addView(durationLabel, FrameLayout.LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
        durationBg.layoutParams = FrameLayout.LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM or Gravity.END
        ).apply { marginEnd = context.dpToPx(6f); bottomMargin = context.dpToPx(6f) }
        videoOverlay.addView(durationBg)
    }

    private fun buildPollContainer() {
        pollContainer.orientation = LinearLayout.VERTICAL
        pollContainer.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        )
        pollContainer.isVisible = false

        pollQuestionLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.POLL_QUESTION_TEXT_SIZE_SP)
        pollQuestionLabel.setTypeface(null, android.graphics.Typeface.BOLD)
        pollQuestionLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = context.dpToPx(C.POLL_SPACING_DP) }

        pollVotesLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.POLL_VOTES_TEXT_SIZE_SP)
        pollVotesLabel.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = context.dpToPx(C.POLL_SPACING_DP) }

        pollContainer.addView(pollQuestionLabel)
        // Option rows are added dynamically
        pollContainer.addView(pollVotesLabel)
    }

    private fun buildFileContainer() {
        fileContainer.orientation = LinearLayout.HORIZONTAL
        fileContainer.gravity = Gravity.CENTER_VERTICAL
        fileContainer.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(C.FILE_ROW_HEIGHT_DP)
        )
        fileContainer.isVisible = false

        val iconSize = context.dpToPx(C.FILE_ICON_SIZE_DP)
        fileIcon.layoutParams = LinearLayout.LayoutParams(iconSize, iconSize).apply {
            marginEnd = context.dpToPx(C.FILE_SPACING_DP)
        }
        fileIcon.scaleType = ImageView.ScaleType.CENTER_INSIDE

        val textColumn = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        fileNameLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.FILE_NAME_TEXT_SIZE_SP)
        fileNameLabel.setTypeface(null, android.graphics.Typeface.BOLD)
        fileNameLabel.maxLines = 1
        fileNameLabel.ellipsize = TextUtils.TruncateAt.MIDDLE

        fileSizeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.FILE_SIZE_TEXT_SIZE_SP)

        textColumn.addView(fileNameLabel)
        textColumn.addView(fileSizeLabel)

        fileContainer.addView(fileIcon)
        fileContainer.addView(textColumn)
    }

    private fun buildVoiceContainer() {
        voiceContainer.orientation = LinearLayout.HORIZONTAL
        voiceContainer.gravity = Gravity.CENTER_VERTICAL
        voiceContainer.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(40f)
        )
        voiceContainer.isVisible = false

        val playSize = context.dpToPx(36f)
        voicePlayButton.layoutParams = LinearLayout.LayoutParams(playSize, playSize).apply {
            marginEnd = context.dpToPx(8f)
        }
        voicePlayButton.scaleType = ImageView.ScaleType.CENTER_INSIDE
        voicePlayButton.setImageDrawable(SendArrowDrawable(context).apply {
            // reuse play icon concept — ideally use a proper play icon
        })

        val infoColumn = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        voiceWaveform.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(20f)
        )
        voiceWaveform.setBackgroundColor(Color.TRANSPARENT)

        voiceDurationLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)

        infoColumn.addView(voiceWaveform)
        infoColumn.addView(voiceDurationLabel)

        voiceContainer.addView(voicePlayButton)
        voiceContainer.addView(infoColumn)
    }

    private fun configureVoice(payload: MessageContent.VoicePayload, textColor: Int, theme: ChatTheme) {
        val accentColor = if (isMine) theme.outgoingTextColor else theme.incomingReplyAccent
        voicePlayButton.setColorFilter(accentColor)
        voiceDurationLabel.setTextColor(textColor and 0x99FFFFFF.toInt())

        val total = payload.duration.toInt()
        val m = total / 60
        val s = total % 60
        voiceDurationLabel.text = String.format("%d:%02d", m, s)

        // Simple waveform background — colored bar
        voiceWaveform.background = GradientDrawable().apply {
            cornerRadius = context.dpToPx(2f).toFloat()
            setColor(adjustAlpha(accentColor, 0.3f))
        }
    }

    private fun applyBubbleShape() {
        val r = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP).toFloat()
        val radii = floatArrayOf(r, r, r, r, r, r, r, r)
        bubble.background = GradientDrawable().apply { cornerRadii = radii }
    }

    private fun applyBubbleColors(theme: ChatTheme) {
        if (isEmojiOnly) {
            currentBubbleColor = Color.TRANSPARENT
            (bubble.background as? GradientDrawable)?.setColor(Color.TRANSPARENT)
        } else {
            val color = if (isMine) theme.outgoingBubbleColor else theme.incomingBubbleColor
            currentBubbleColor = color
            (bubble.background as? GradientDrawable)?.setColor(color)
        }
    }

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
        if (message.content.hasMedia || resolvedReply is ResolvedReply.Found) return
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

        // Reset all content views
        textView.isVisible = false
        imageView.isVisible = false
        videoOverlay.isVisible = false
        voiceContainer.isVisible = false
        pollContainer.isVisible = false
        fileContainer.isVisible = false

        when (val content = message.content) {
            is MessageContent.Text -> {
                val body = content.textBody ?: ""
                val emojiCount = EmojiHelper.emojiOnlyCount(body)
                textView.isVisible = true
                textView.text = body
                if (isEmojiOnly && emojiCount != null) {
                    textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, EmojiHelper.fontSize(emojiCount))
                    textView.gravity = Gravity.CENTER
                } else {
                    textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
                    textView.gravity = Gravity.START
                    textView.setTextColor(textColor)
                }
            }
            is MessageContent.Image -> {
                imageView.isVisible = true
                loadImage(content.imagePayload!!, theme)
            }
            is MessageContent.Mixed -> {
                textView.isVisible = true
                imageView.isVisible = true
                textView.text = content.textBody
                textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
                textView.gravity = Gravity.START
                textView.setTextColor(textColor)
                loadImage(content.imagePayload!!, theme)
            }
            is MessageContent.Video -> {
                videoOverlay.isVisible = true
                configureVideoOverlay(content.payload, theme)
            }
            is MessageContent.MixedTextVideo -> {
                textView.isVisible = true
                videoOverlay.isVisible = true
                textView.text = content.textBody
                textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.MESSAGE_TEXT_SIZE_SP)
                textView.gravity = Gravity.START
                textView.setTextColor(textColor)
                configureVideoOverlay(content.video, theme)
            }
            is MessageContent.Voice -> {
                voiceContainer.isVisible = true
                configureVoice(content.payload, textColor, theme)
            }
            is MessageContent.Poll -> {
                pollContainer.isVisible = true
                configurePoll(content.payload, textColor, theme)
            }
            is MessageContent.File -> {
                fileContainer.isVisible = true
                configureFile(content.payload, textColor)
            }
        }
    }

    private fun configureVideoOverlay(payload: MessageContent.VideoPayload, theme: ChatTheme) {
        val thumbnailIv = videoOverlay.findViewWithTag<ImageView>("video_thumb") ?: return
        val w = context.dpToPx(200f)
        if (payload.width != null && payload.width > 0 && payload.height != null && payload.height > 0) {
            val scaledH = (w * (payload.height / payload.width)).toInt()
            videoOverlay.layoutParams = (videoOverlay.layoutParams as LinearLayout.LayoutParams).apply {
                width = LinearLayout.LayoutParams.MATCH_PARENT; height = scaledH
            }
        }
        thumbnailIv.background = GradientDrawable().apply {
            setColor(if (isMine) theme.outgoingBubbleColor else theme.incomingBubbleColor)
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP).toFloat()
        }
        val url = payload.thumbnailUrl?.takeIf { it.isNotBlank() }
        if (url != null) {
            ImageLoader.load(context, url, thumbnailIv,
                cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP), targetW = w, targetH = w)
        }

        if (payload.duration != null && payload.duration > 0) {
            durationBg.isVisible = true
            val total = payload.duration.toInt()
            durationLabel.text = "${total / 60}:${String.format("%02d", total % 60)}"
        } else {
            durationBg.isVisible = false
        }

        videoOverlay.setOnClickListener {
            onVideoTap?.invoke(payload.url)
        }
    }

    private fun configurePoll(poll: MessageContent.PollPayload, textColor: Int, theme: ChatTheme) {
        pollQuestionLabel.text = poll.question
        pollQuestionLabel.setTextColor(textColor)

        // Remove old option views
        pollOptionViews.forEach { pollContainer.removeView(it) }
        pollOptionViews.clear()

        // Insert options before votesLabel
        val votesIndex = pollContainer.indexOfChild(pollVotesLabel)
        for (option in poll.options) {
            val row = PollOptionRowView(context)
            row.configure(option, option.id == poll.selectedOptionId, poll.isClosed, isMine, theme)
            row.setOnClickListener {
                if (!poll.isClosed) onPollOptionTap?.invoke(poll.id, option.id)
            }
            pollContainer.addView(row, votesIndex, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, context.dpToPx(C.POLL_BAR_HEIGHT_DP)
            ).apply { bottomMargin = context.dpToPx(C.POLL_SPACING_DP) })
            pollOptionViews.add(row)
        }

        pollVotesLabel.text = "${poll.totalVotes} votes"
        pollVotesLabel.setTextColor(textColor and 0x00FFFFFF or 0x99000000.toInt())
    }

    private fun configureFile(file: MessageContent.FilePayload, textColor: Int) {
        fileNameLabel.text = file.name
        fileNameLabel.setTextColor(textColor)
        fileSizeLabel.text = formatFileSize(file.size)
        fileSizeLabel.setTextColor(textColor and 0x00FFFFFF or 0x99000000.toInt())

        // Icon based on mimeType
        val iconRes = when {
            file.mimeType?.startsWith("image/") == true -> android.R.drawable.ic_menu_gallery
            file.mimeType?.startsWith("video/") == true -> android.R.drawable.ic_media_play
            file.mimeType?.startsWith("audio/") == true -> android.R.drawable.ic_lock_silent_mode_off
            else -> android.R.drawable.ic_menu_save
        }
        fileIcon.setImageResource(iconRes)
        fileIcon.setColorFilter(if (isMine) textColor else Color.parseColor("#007AFF"))

        fileContainer.setOnClickListener {
            onFileTap?.invoke(file.url, file.name)
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
            cornerRadius = context.dpToPx(C.BUBBLE_CORNER_RADIUS_DP), targetW = w, targetH = w)
    }

    private fun configureFooter(message: ChatMessage, theme: ChatTheme) {
        if (isEmojiOnly) {
            footerRow.isVisible = false
            return
        }
        footerRow.isVisible = true
        timeLabel.text = DateHelper.timeString(message.timestamp)
        timeLabel.setTextColor(if (isMine) theme.outgoingTimeColor else theme.incomingTimeColor)
        editedLabel.isVisible = message.isEdited
        editedLabel.setTextColor(if (isMine) theme.outgoingEditedColor else theme.incomingEditedColor)
        statusView.configure(message.status, isMine, theme)
    }

    companion object {
        fun formatFileSize(bytes: Long): String = when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> String.format("%.1f MB", bytes / (1024.0 * 1024.0))
            else -> String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0))
        }
    }
}

/** Emoji detection and sizing utility. */
object EmojiHelper {
    fun emojiOnlyCount(text: String): Int? {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || trimmed.codePointCount(0, trimmed.length) > 12) return null
        var count = 0
        var i = 0
        while (i < trimmed.length) {
            val cp = Character.codePointAt(trimmed, i)
            val charCount = Character.charCount(cp)
            // Check if grapheme cluster is emoji
            val char = trimmed.substring(i, minOf(i + charCount, trimmed.length))
            // Simple emoji detection: check if codepoint is in emoji ranges
            if (!isEmojiCodepoint(cp) && cp != 0xFE0F && cp != 0x200D) return null
            // Skip ZWJ and variation selectors — they're part of the previous emoji
            if (cp != 0x200D && cp != 0xFE0F && cp != 0x20E3) {
                // Only count base emoji codepoints
                if (isEmojiCodepoint(cp)) count++
            }
            i += charCount
            if (count > 3) return null
        }
        return if (count in 1..3) count else null
    }

    fun fontSize(count: Int): Float = when (count) {
        1 -> C.EMOJI_ONLY_TEXT_SIZE_1
        2 -> C.EMOJI_ONLY_TEXT_SIZE_2
        else -> C.EMOJI_ONLY_TEXT_SIZE_3
    }

    private fun isEmojiCodepoint(cp: Int): Boolean = when (cp) {
        in 0x1F600..0x1F64F, // Emoticons
        in 0x1F300..0x1F5FF, // Misc Symbols and Pictographs
        in 0x1F680..0x1F6FF, // Transport and Map
        in 0x1F1E0..0x1F1FF, // Flags
        in 0x2600..0x26FF,   // Misc symbols
        in 0x2700..0x27BF,   // Dingbats
        in 0xFE00..0xFE0F,   // Variation Selectors
        in 0x1F900..0x1F9FF, // Supplemental Symbols
        in 0x1FA00..0x1FA6F, // Chess Symbols
        in 0x1FA70..0x1FAFF, // Symbols Extended-A
        in 0x231A..0x231B,   // Watch, Hourglass
        in 0x23E9..0x23F3,   // Various
        in 0x23F8..0x23FA,   // Various
        in 0x25AA..0x25AB,   // Squares
        in 0x25B6..0x25C0,   // Triangles
        in 0x25FB..0x25FE,   // Squares
        in 0x2602..0x2603,   // Umbrella, Snowman
        in 0x2614..0x2615,   // Umbrella, Hot Beverage
        in 0x2648..0x2653,   // Zodiac
        in 0x267F..0x267F,   // Wheelchair
        in 0x2693..0x2693,   // Anchor
        in 0x2764..0x2764,   // Heart
        0x200D,              // ZWJ
        0x20E3,              // Combining Enclosing Keycap
        0x2B05, 0x2B06, 0x2B07, 0x2B1B, 0x2B1C, 0x2B50, 0x2B55,
        0x3030, 0x303D, 0x3297, 0x3299,
        0xA9, 0xAE -> true
        else -> cp >= 0x1F000
    }
}

/** Poll option row with progress bar. */
class PollOptionRowView(context: Context) : FrameLayout(context) {

    private val barBg = View(context)
    private val barFill = View(context)
    private val textLabel = TextView(context)
    private val percentLabel = TextView(context)

    init {
        barBg.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        barFill.layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT)
        textLabel.setPadding(context.dpToPx(8f), 0, 0, 0)
        textLabel.gravity = Gravity.CENTER_VERTICAL
        textLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.POLL_OPTION_TEXT_SIZE_SP)
        textLabel.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT)
        percentLabel.gravity = Gravity.CENTER_VERTICAL or Gravity.END
        percentLabel.setPadding(0, 0, context.dpToPx(8f), 0)
        percentLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.POLL_OPTION_TEXT_SIZE_SP)
        percentLabel.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT, Gravity.END)

        addView(barBg)
        addView(barFill)
        addView(textLabel)
        addView(percentLabel)
    }

    fun configure(option: MessageContent.PollOption, isSelected: Boolean, isClosed: Boolean,
                  isMine: Boolean, theme: ChatTheme) {
        val accentColor = if (isMine) theme.outgoingReplyAccent else theme.incomingReplyAccent
        val textColor = if (isMine) theme.outgoingTextColor else theme.incomingTextColor

        barBg.background = GradientDrawable().apply {
            setColor(accentColor and 0x00FFFFFF or 0x1F000000)
            cornerRadius = context.dpToPx(C.POLL_BAR_CORNER_DP).toFloat()
        }
        barFill.background = GradientDrawable().apply {
            setColor(if (isSelected) accentColor and 0x00FFFFFF or 0x59000000
                     else accentColor and 0x00FFFFFF or 0x33000000)
            cornerRadius = context.dpToPx(C.POLL_BAR_CORNER_DP).toFloat()
        }

        textLabel.text = if (isSelected) "✓ ${option.text}" else option.text
        textLabel.setTextColor(textColor)
        percentLabel.text = "${option.percentage.toInt()}%"
        percentLabel.setTextColor(textColor and 0x00FFFFFF or 0xB3000000.toInt())

        alpha = if (isClosed) 0.7f else 1f
        isClickable = !isClosed

        // Set fill width via percentage
        post {
            val parentW = (parent as? View)?.width ?: width
            if (parentW > 0) {
                barFill.layoutParams = (barFill.layoutParams as LayoutParams).apply {
                    width = (parentW * (option.percentage / 100f).coerceIn(0.01f, 1f)).toInt()
                }
                barFill.requestLayout()
            }
        }
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

        senderLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        senderLabel.setTypeface(null, android.graphics.Typeface.BOLD)

        bodyLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        bodyLabel.maxLines = 2
        bodyLabel.ellipsize = TextUtils.TruncateAt.END

        deletedLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
        deletedLabel.setTypeface(null, android.graphics.Typeface.ITALIC)
        deletedLabel.visibility = View.GONE

        column.addView(senderLabel)
        column.addView(bodyLabel)
        column.addView(deletedLabel)
        addView(accentBar)
        addView(column)
    }

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
                info.hasImage -> "\uD83D\uDCF7 Photo"
                else -> ""
            }
            bodyLabel.setTextColor(textColor)
        }
    }
}

class StatusIconView(context: Context) : TextView(context) {

    init {
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
        gravity = Gravity.CENTER
    }

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
            ViewGroup.LayoutParams.MATCH_PARENT, context.dpToPx(C.DATE_SEPARATOR_HEIGHT_DP))
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, C.DATE_SEPARATOR_TEXT_SIZE_SP)
        label.gravity = Gravity.CENTER
        label.setPadding(context.dpToPx(14f), context.dpToPx(4f), context.dpToPx(14f), context.dpToPx(4f))
        addView(label, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER))
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
