package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView

// ─── Item types ───────────────────────────────────────────────────────────────

private const val TYPE_DATE_SEPARATOR    = 0
private const val TYPE_INCOMING_TEXT     = 1
private const val TYPE_OUTGOING_TEXT     = 2
private const val TYPE_INCOMING_IMAGE    = 3
private const val TYPE_OUTGOING_IMAGE    = 4
private const val TYPE_INCOMING_MIXED    = 5
private const val TYPE_OUTGOING_MIXED    = 6

// ─── ListItem ─────────────────────────────────────────────────────────────────
//
// Плоский список: секции + сообщения. Аналог DiffableDataSource snapshot в iOS.

sealed class ListItem {
    data class DateItem(val dateKey: String, val title: String) : ListItem()
    data class MessageItem(val message: ChatMessage) : ListItem()
}

// ─── ChatSectionedAdapter ─────────────────────────────────────────────────────

class ChatSectionedAdapter(
    private val context: Context,
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    // ─── Theme & data ──────────────────────────────────────────────────────

    var theme: ChatTheme = ChatTheme.light()
        set(value) { field = value; notifyDataSetChanged() }

    /** id → ChatMessage. Используется для резолвинга reply. */
    var messageIndex: Map<String, ChatMessage> = emptyMap()

    private var items: List<ListItem> = emptyList()

    // ─── Callbacks ────────────────────────────────────────────────────────

    var onMessagePress: ((messageId: String) -> Unit)? = null
    var onMessageLongPress: ((messageId: String, anchorView: View) -> Unit)? = null
    var onReplyPress: ((replyId: String) -> Unit)? = null

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Применяет новый список секций через DiffUtil — без мигания.
     * Строит плоский список [DateItem, MessageItem, MessageItem, DateItem, …].
     */
    fun submitSections(sections: List<MessageSection>, newIndex: Map<String, ChatMessage>) {
        messageIndex = newIndex
        val newItems = buildFlatList(sections)
        val diff = DiffUtil.calculateDiff(ItemDiffCallback(items, newItems))
        items = newItems
        diff.dispatchUpdatesTo(this)
    }

    /** Возвращает позицию сообщения по id или -1. */
    fun positionOfMessage(id: String): Int =
        items.indexOfFirst { it is ListItem.MessageItem && it.message.id == id }

    /** Возвращает позицию следующего MessageItem после позиции pos, используется при highlight. */
    fun messageAt(position: Int): ChatMessage? =
        (items.getOrNull(position) as? ListItem.MessageItem)?.message

    // ─── RecyclerView.Adapter ─────────────────────────────────────────────

    override fun getItemCount(): Int = items.size

    override fun getItemViewType(position: Int): Int = when (val item = items[position]) {
        is ListItem.DateItem -> TYPE_DATE_SEPARATOR
        is ListItem.MessageItem -> {
            val msg = item.message
            when {
                msg.hasImage && msg.hasText && msg.isMine  -> TYPE_OUTGOING_MIXED
                msg.hasImage && msg.hasText && !msg.isMine -> TYPE_INCOMING_MIXED
                msg.hasImage && msg.isMine                  -> TYPE_OUTGOING_IMAGE
                msg.hasImage                                -> TYPE_INCOMING_IMAGE
                msg.isMine                                  -> TYPE_OUTGOING_TEXT
                else                                        -> TYPE_INCOMING_TEXT
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        when (viewType) {
            TYPE_DATE_SEPARATOR  -> DateSeparatorViewHolder(DateSeparatorView(context))
            TYPE_INCOMING_TEXT   -> MessageViewHolder(MessageBubbleView(context, isMine = false))
            TYPE_OUTGOING_TEXT   -> MessageViewHolder(MessageBubbleView(context, isMine = true))
            TYPE_INCOMING_IMAGE  -> MessageViewHolder(MessageBubbleView(context, isMine = false))
            TYPE_OUTGOING_IMAGE  -> MessageViewHolder(MessageBubbleView(context, isMine = true))
            TYPE_INCOMING_MIXED  -> MessageViewHolder(MessageBubbleView(context, isMine = false))
            TYPE_OUTGOING_MIXED  -> MessageViewHolder(MessageBubbleView(context, isMine = true))
            else                 -> MessageViewHolder(MessageBubbleView(context, isMine = false))
        }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is ListItem.DateItem -> {
                (holder as DateSeparatorViewHolder).bind(item.title, theme)
            }
            is ListItem.MessageItem -> {
                val msg = item.message
                val resolved = resolveReply(msg)
                val bubbleView = (holder as MessageViewHolder).bubbleView

                bubbleView.configure(
                    message       = msg,
                    resolvedReply = resolved,
                    theme         = theme,
                )

                // Reply tap
                bubbleView.onReplyTap = { replyId ->
                    onReplyPress?.invoke(replyId)
                }

                // Message tap
                holder.itemView.setOnClickListener {
                    onMessagePress?.invoke(msg.id)
                }

                // Long press → context menu
                holder.itemView.setOnLongClickListener { v ->
                    v.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                    onMessageLongPress?.invoke(msg.id, v)
                    true
                }
            }
        }
    }

    override fun onViewRecycled(holder: RecyclerView.ViewHolder) {
        super.onViewRecycled(holder)
        if (holder is MessageViewHolder) holder.bubbleView.prepareForReuse()
    }

    // ─── Highlight ────────────────────────────────────────────────────────

    fun highlightItem(recyclerView: RecyclerView, position: Int) {
        val holder = recyclerView.findViewHolderForAdapterPosition(position) ?: return
        val view   = holder.itemView
        ValueAnimator.ofFloat(1f, 0.35f, 1f, 0.6f, 1f).apply {
            duration     = 600
            interpolator = DecelerateInterpolator()
            addUpdateListener { view.alpha = it.animatedValue as Float }
            start()
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────

    private fun buildFlatList(sections: List<MessageSection>): List<ListItem> {
        val list = mutableListOf<ListItem>()
        for (section in sections) {
            list.add(ListItem.DateItem(section.dateKey, DateHelper.sectionTitle(section.dateKey)))
            section.messages.mapTo(list) { ListItem.MessageItem(it) }
        }
        return list
    }

    private fun resolveReply(message: ChatMessage): ResolvedReply? {
        val reply = message.reply ?: return null
        val original = messageIndex[reply.replyToId]
        return if (original != null) ResolvedReply.Found(ReplyDisplayInfo.from(original))
               else ResolvedReply.Deleted
    }

    // ─── DiffCallback ─────────────────────────────────────────────────────

    private class ItemDiffCallback(
        private val old: List<ListItem>,
        private val new: List<ListItem>,
    ) : DiffUtil.Callback() {
        override fun getOldListSize() = old.size
        override fun getNewListSize() = new.size

        override fun areItemsTheSame(oldPos: Int, newPos: Int): Boolean {
            val o = old[oldPos]; val n = new[newPos]
            return when {
                o is ListItem.DateItem    && n is ListItem.DateItem    -> o.dateKey == n.dateKey
                o is ListItem.MessageItem && n is ListItem.MessageItem -> o.message.id == n.message.id
                else -> false
            }
        }

        override fun areContentsTheSame(oldPos: Int, newPos: Int): Boolean =
            old[oldPos] == new[newPos]

        override fun getChangePayload(oldPos: Int, newPos: Int): Any? = Unit // non-null = no flicker
    }
}

// ─── ViewHolders ──────────────────────────────────────────────────────────────

class DateSeparatorViewHolder(val view: DateSeparatorView) : RecyclerView.ViewHolder(view) {
    fun bind(title: String, theme: ChatTheme) = view.configure(title, theme)
}

class MessageViewHolder(val bubbleView: MessageBubbleView) : RecyclerView.ViewHolder(bubbleView)
