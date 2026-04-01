package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView

private const val TYPE_DATE_SEPARATOR = 0
private const val TYPE_INCOMING_TEXT = 1
private const val TYPE_OUTGOING_TEXT = 2
private const val TYPE_INCOMING_IMAGE = 3
private const val TYPE_OUTGOING_IMAGE = 4
private const val TYPE_INCOMING_MIXED = 5
private const val TYPE_OUTGOING_MIXED = 6
private const val TYPE_INCOMING_VIDEO = 7
private const val TYPE_OUTGOING_VIDEO = 8
private const val TYPE_INCOMING_MIXED_VIDEO = 9
private const val TYPE_OUTGOING_MIXED_VIDEO = 10
private const val TYPE_INCOMING_POLL = 11
private const val TYPE_OUTGOING_POLL = 12
private const val TYPE_INCOMING_FILE = 13
private const val TYPE_OUTGOING_FILE = 14
private const val TYPE_INCOMING_VOICE = 15
private const val TYPE_OUTGOING_VOICE = 16

sealed class ListItem {
    data class DateItem(val dateKey: String, val title: String) : ListItem()
    data class MessageItem(val message: ChatMessage) : ListItem()
}

class ChatAdapter(
    private val context: Context,
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    var theme: ChatTheme = ChatTheme.light()
        set(value) {
            if (field == value) return
            field = value
            notifyDataSetChanged()
        }

    private var messageIndex: Map<String, ChatMessage> = emptyMap()
    private var items: List<ListItem> = emptyList()
    private var recyclerViewRef: RecyclerView? = null

    var onMessagePress: ((messageId: String) -> Unit)? = null
    var onMessageLongPress: ((messageId: String, anchorView: View, isMine: Boolean) -> Unit)? = null
    var onReplyPress: ((replyId: String) -> Unit)? = null
    var onVideoPress: ((messageId: String, videoUrl: String) -> Unit)? = null
    var onPollOptionPress: ((messageId: String, pollId: String, optionId: String) -> Unit)? = null
    var onFilePress: ((messageId: String, fileUrl: String, fileName: String) -> Unit)? = null

    fun submitSections(
        sections: List<MessageSection>,
        newIndex: Map<String, ChatMessage>,
        affectedIds: Set<String> = emptySet(),
    ) {
        messageIndex = newIndex
        val newItems = buildFlatList(sections)
        val diff = DiffUtil.calculateDiff(ItemDiffCallback(items, newItems), true)
        items = newItems
        diff.dispatchUpdatesTo(this)

        if (affectedIds.isNotEmpty()) {
            recyclerViewRef?.let { rv ->
                affectedIds.forEach { id ->
                    val pos = positionOfMessage(id)
                    if (pos >= 0) rv.findViewHolderForAdapterPosition(pos)?.itemView?.alpha = 1f
                }
            }
        }

        recyclerViewRef?.scrollBy(0, 0)
    }

    fun positionOfMessage(id: String): Int =
        items.indexOfFirst { it is ListItem.MessageItem && it.message.id == id }

    fun messageAt(position: Int): ChatMessage? =
        (items.getOrNull(position) as? ListItem.MessageItem)?.message

    override fun onAttachedToRecyclerView(recyclerView: RecyclerView) {
        super.onAttachedToRecyclerView(recyclerView)
        recyclerViewRef = recyclerView
    }

    override fun onDetachedFromRecyclerView(recyclerView: RecyclerView) {
        super.onDetachedFromRecyclerView(recyclerView)
        recyclerViewRef = null
    }

    override fun getItemCount() = items.size

    override fun getItemViewType(position: Int): Int = when (val item = items[position]) {
        is ListItem.DateItem -> TYPE_DATE_SEPARATOR
        is ListItem.MessageItem -> {
            val msg = item.message
            when (msg.content) {
                is MessageContent.Poll -> if (msg.isMine) TYPE_OUTGOING_POLL else TYPE_INCOMING_POLL
                is MessageContent.File -> if (msg.isMine) TYPE_OUTGOING_FILE else TYPE_INCOMING_FILE
                is MessageContent.Voice -> if (msg.isMine) TYPE_OUTGOING_VOICE else TYPE_INCOMING_VOICE
                is MessageContent.Video -> if (msg.isMine) TYPE_OUTGOING_VIDEO else TYPE_INCOMING_VIDEO
                is MessageContent.MixedTextVideo -> if (msg.isMine) TYPE_OUTGOING_MIXED_VIDEO else TYPE_INCOMING_MIXED_VIDEO
                is MessageContent.Mixed -> if (msg.isMine) TYPE_OUTGOING_MIXED else TYPE_INCOMING_MIXED
                is MessageContent.Image -> if (msg.isMine) TYPE_OUTGOING_IMAGE else TYPE_INCOMING_IMAGE
                is MessageContent.Text -> if (msg.isMine) TYPE_OUTGOING_TEXT else TYPE_INCOMING_TEXT
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        when (viewType) {
            TYPE_DATE_SEPARATOR -> DateSeparatorViewHolder(DateSeparatorView(context))
            else -> {
                val isMine = viewType in setOf(
                    TYPE_OUTGOING_TEXT, TYPE_OUTGOING_IMAGE, TYPE_OUTGOING_MIXED,
                    TYPE_OUTGOING_VIDEO, TYPE_OUTGOING_MIXED_VIDEO,
                    TYPE_OUTGOING_VOICE, TYPE_OUTGOING_POLL, TYPE_OUTGOING_FILE)
                MessageViewHolder(MessageBubbleView(context, isMine)).also { vh ->
                    vh.bubbleView.onReplyTap = { replyId -> onReplyPress?.invoke(replyId) }
                }
            }
        }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        holder.itemView.alpha = 1f
        when (val item = items[position]) {
            is ListItem.DateItem -> (holder as DateSeparatorViewHolder).bind(item.title, theme)
            is ListItem.MessageItem -> {
                val msg = item.message
                val resolved = resolveReply(msg)
                (holder as MessageViewHolder).apply {
                    bubbleView.configure(msg, resolved, theme)
                    bubbleView.bubble.setOnClickListener { onMessagePress?.invoke(msg.id) }
                    bubbleView.bubble.setOnLongClickListener {
                        onMessageLongPress?.invoke(msg.id, bubbleView.bubble, msg.isMine)
                        true
                    }
                    // Wire content-specific callbacks
                    bubbleView.onVideoTap = { videoUrl ->
                        onVideoPress?.invoke(msg.id, videoUrl)
                    }
                    bubbleView.onPollOptionTap = { pollId, optionId ->
                        onPollOptionPress?.invoke(msg.id, pollId, optionId)
                    }
                    bubbleView.onFileTap = { fileUrl, fileName ->
                        onFilePress?.invoke(msg.id, fileUrl, fileName)
                    }
                }
            }
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int, payloads: List<Any>) {
        if (payloads.isEmpty()) super.onBindViewHolder(holder, position, payloads)
        else onBindViewHolder(holder, position)
    }

    override fun onViewRecycled(holder: RecyclerView.ViewHolder) {
        super.onViewRecycled(holder)
        holder.itemView.alpha = 1f
        if (holder is MessageViewHolder) holder.bubbleView.prepareForReuse()
    }

    fun highlightItem(recyclerView: RecyclerView, position: Int) {
        val holder = recyclerView.findViewHolderForAdapterPosition(position) as? MessageViewHolder ?: return
        val bubble = holder.bubbleView.bubble
        val origColor = holder.bubbleView.currentBubbleColor
        val flashColor = android.graphics.Color.argb(140, 255, 204, 0)

        val phase1 = ValueAnimator.ofArgb(origColor, flashColor).apply {
            duration = 250
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                (bubble.background as? android.graphics.drawable.GradientDrawable)?.setColor(it.animatedValue as Int)
            }
        }
        val phase2 = ValueAnimator.ofArgb(flashColor, origColor).apply {
            duration = 250
            startDelay = 750
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                (bubble.background as? android.graphics.drawable.GradientDrawable)?.setColor(it.animatedValue as Int)
            }
        }
        phase1.start()
        phase2.start()
    }

    private fun resolveReply(message: ChatMessage): ResolvedReply? {
        val replyInfo = message.reply ?: return null
        val original = messageIndex[replyInfo.replyToId]
        return if (original != null) {
            ResolvedReply.Found(ReplyDisplayInfo.fromLive(original))
        } else {
            ResolvedReply.Deleted(ReplyDisplayInfo.fromSnapshot(replyInfo))
        }
    }

    private fun buildFlatList(sections: List<MessageSection>): List<ListItem> {
        val list = ArrayList<ListItem>(sections.sumOf { it.messages.size + 1 })
        sections.forEach { section ->
            list.add(ListItem.DateItem(section.dateKey, DateHelper.sectionTitle(section.dateKey)))
            section.messages.forEach { msg -> list.add(ListItem.MessageItem(msg)) }
        }
        return list
    }

    private class ItemDiffCallback(
        private val old: List<ListItem>,
        private val new: List<ListItem>,
    ) : DiffUtil.Callback() {

        override fun getOldListSize() = old.size
        override fun getNewListSize() = new.size

        override fun areItemsTheSame(oldPos: Int, newPos: Int): Boolean {
            val o = old[oldPos]; val n = new[newPos]
            return when {
                o is ListItem.DateItem && n is ListItem.DateItem -> o.dateKey == n.dateKey
                o is ListItem.MessageItem && n is ListItem.MessageItem -> o.message.id == n.message.id
                else -> false
            }
        }

        override fun areContentsTheSame(oldPos: Int, newPos: Int): Boolean {
            val o = old[oldPos]; val n = new[newPos]
            return when {
                o is ListItem.DateItem && n is ListItem.DateItem -> o == n
                o is ListItem.MessageItem && n is ListItem.MessageItem -> o.message == n.message
                else -> false
            }
        }

        override fun getChangePayload(oldPos: Int, newPos: Int): Any? = Unit
    }
}

class DateSeparatorViewHolder(val view: DateSeparatorView) : RecyclerView.ViewHolder(view) {
    fun bind(title: String, theme: ChatTheme) = view.configure(title, theme)
}

class MessageViewHolder(val bubbleView: MessageBubbleView) : RecyclerView.ViewHolder(bubbleView)
