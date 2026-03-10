package com.rnapp.rnchatview

import android.animation.ValueAnimator
import android.content.Context
import android.util.Log
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView

private const val TAG = "ChatSectionedAdapter"

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
        set(value) {
            Log.d(TAG, "Theme changed to: ${if (value.isDark) "dark" else "light"}")
            field = value
            notifyDataSetChanged()
        }

    /** id → ChatMessage. Используется для резолвинга reply. */
    var messageIndex: Map<String, ChatMessage> = emptyMap()
        set(value) {
            Log.d(TAG, "messageIndex updated: ${value.size} entries")
            field = value
        }

    private var items: List<ListItem> = emptyList()
        set(value) {
            val oldSize = field.size
            val newSize = value.size
            Log.d(TAG, "items list changed: $oldSize -> $newSize items")
            field = value
        }

    // ─── Callbacks ────────────────────────────────────────────────────────

    var onMessagePress: ((messageId: String) -> Unit)? = null
    var onMessageLongPress: ((messageId: String, anchorView: View, isMine: Boolean) -> Unit)? = null
    var onReplyPress: ((replyId: String) -> Unit)? = null

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Применяет новый список секций через DiffUtil — без мигания.
     * Строит плоский список [DateItem, MessageItem, MessageItem, DateItem, …].
     */
    fun submitSections(sections: List<MessageSection>, newIndex: Map<String, ChatMessage>) {
        Log.d(TAG, "=== submitSections called ===")
        Log.d(TAG, "Sections count: ${sections.size}")
        Log.d(TAG, "Total messages in sections: ${sections.sumOf { it.messages.size }}")
        Log.d(TAG, "New index size: ${newIndex.size}")

        // Логируем первые несколько сообщений для отладки
        sections.take(2).forEachIndexed { sectionIdx, section ->
            Log.d(TAG, "Section $sectionIdx (${section.dateKey}): ${section.messages.size} messages")
            section.messages.take(3).forEach { msg ->
                Log.d(TAG, "  - Message: id=${msg.id}, text='${msg.text?.take(20)}', isMine=${msg.isMine}")
            }
        }

        messageIndex = newIndex

        val oldItemsCount = items.size
        val newItems = buildFlatList(sections)
        val newItemsCount = newItems.size

        Log.d(TAG, "Old items count: $oldItemsCount")
        Log.d(TAG, "New items count: $newItemsCount")

        // Проверяем какие сообщения были удалены
        val oldMessageIds = items.filterIsInstance<ListItem.MessageItem>().map { it.message.id }.toSet()
        val newMessageIds = newItems.filterIsInstance<ListItem.MessageItem>().map { it.message.id }.toSet()

        val addedIds = newMessageIds - oldMessageIds
        val removedIds = oldMessageIds - newMessageIds
        val commonIds = oldMessageIds.intersect(newMessageIds)

        if (removedIds.isNotEmpty()) {
            Log.d(TAG, "REMOVED MESSAGES (${removedIds.size}): $removedIds")
        }
        if (addedIds.isNotEmpty()) {
            Log.d(TAG, "ADDED MESSAGES (${addedIds.size}): $addedIds")
        }
        if (commonIds.isNotEmpty()) {
            Log.d(TAG, "COMMON MESSAGES: ${commonIds.size}")
        }

        // Проверяем изменения в DateItem
        val oldDateKeys = items.filterIsInstance<ListItem.DateItem>().map { it.dateKey }.toSet()
        val newDateKeys = newItems.filterIsInstance<ListItem.DateItem>().map { it.dateKey }.toSet()

        val addedDates = newDateKeys - oldDateKeys
        val removedDates = oldDateKeys - newDateKeys

        if (removedDates.isNotEmpty()) {
            Log.d(TAG, "REMOVED DATE SECTIONS: $removedDates")
        }
        if (addedDates.isNotEmpty()) {
            Log.d(TAG, "ADDED DATE SECTIONS: $addedDates")
        }

        // Рассчитываем DiffUtil
        Log.d(TAG, "Calculating DiffUtil...")
        val startTime = System.currentTimeMillis()
        val diff = DiffUtil.calculateDiff(ItemDiffCallback(items, newItems))
        val diffTime = System.currentTimeMillis() - startTime
        Log.d(TAG, "DiffUtil calculated in ${diffTime}ms")

        // Сохраняем новые данные
        items = newItems

        // Применяем изменения
        Log.d(TAG, "Dispatching updates to adapter...")
        diff.dispatchUpdatesTo(this)
        Log.d(TAG, "=== submitSections completed ===")
    }

    /** Возвращает позицию сообщения по id или -1. */
    fun positionOfMessage(id: String): Int {
        val position = items.indexOfFirst { it is ListItem.MessageItem && it.message.id == id }
        Log.d(TAG, "positionOfMessage for id '$id': $position")
        return position
    }

    /** Возвращает сообщение по позиции, используется при highlight. */
    fun messageAt(position: Int): ChatMessage? {
        val msg = (items.getOrNull(position) as? ListItem.MessageItem)?.message
        if (msg != null) {
            Log.d(TAG, "messageAt position $position: id=${msg.id}")
        } else {
            Log.d(TAG, "messageAt position $position: not found")
        }
        return msg
    }

    // ─── RecyclerView.Adapter ─────────────────────────────────────────────

    override fun getItemCount(): Int {
        val count = items.size
        Log.d(TAG, "getItemCount: $count")
        return count
    }

    override fun getItemViewType(position: Int): Int {
        val item = items[position]
        val viewType = when (item) {
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
        Log.d(TAG, "getItemViewType at $position: $viewType")
        return viewType
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        Log.d(TAG, "onCreateViewHolder for viewType: $viewType")
        val holder = when (viewType) {
            TYPE_DATE_SEPARATOR -> {
                Log.d(TAG, "Creating DateSeparatorViewHolder")
                DateSeparatorViewHolder(DateSeparatorView(context))
            }
            TYPE_INCOMING_TEXT -> {
                Log.d(TAG, "Creating incoming text message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = false))
            }
            TYPE_OUTGOING_TEXT -> {
                Log.d(TAG, "Creating outgoing text message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = true))
            }
            TYPE_INCOMING_IMAGE -> {
                Log.d(TAG, "Creating incoming image message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = false))
            }
            TYPE_OUTGOING_IMAGE -> {
                Log.d(TAG, "Creating outgoing image message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = true))
            }
            TYPE_INCOMING_MIXED -> {
                Log.d(TAG, "Creating incoming mixed message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = false))
            }
            TYPE_OUTGOING_MIXED -> {
                Log.d(TAG, "Creating outgoing mixed message view holder")
                MessageViewHolder(MessageBubbleView(context, isMine = true))
            }
            else -> {
                Log.d(TAG, "Creating default message view holder (incoming)")
                MessageViewHolder(MessageBubbleView(context, isMine = false))
            }
        }
        return holder
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        Log.d(TAG, "onBindViewHolder at position $position")

        when (val item = items[position]) {
            is ListItem.DateItem -> {
                Log.d(TAG, "Binding DateItem: ${item.dateKey} - ${item.title}")
                (holder as DateSeparatorViewHolder).bind(item.title, theme)
            }
            is ListItem.MessageItem -> {
                val msg = item.message
                Log.d(TAG, "Binding MessageItem: id=${msg.id}, text='${msg.text?.take(20)}', isMine=${msg.isMine}")

                val resolved = resolveReply(msg)
                if (resolved != null) {
                    Log.d(TAG, "  Reply resolved: ${resolved.javaClass.simpleName}")
                }

                val bubbleView = (holder as MessageViewHolder).bubbleView

                bubbleView.configure(
                    message       = msg,
                    resolvedReply = resolved,
                    theme         = theme,
                )

                // Reply tap
                bubbleView.onReplyTap = { replyId ->
                    Log.d(TAG, "Reply tap on message ${msg.id}, replying to $replyId")
                    onReplyPress?.invoke(replyId)
                }

                // Message tap
                holder.itemView.setOnClickListener {
                    Log.d(TAG, "Message tap on ${msg.id}")
                    onMessagePress?.invoke(msg.id)
                }

                // Long press on bubble only (not full row) → context menu
                val bubbleAnchor = bubbleView.bubbleView
                bubbleAnchor.setOnLongClickListener { v ->
                    Log.d(TAG, "Message long press on ${msg.id}")
                    v.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                    onMessageLongPress?.invoke(msg.id, v, msg.isMine)
                    true
                }
            }
        }

            holder.itemView.requestLayout()
    }

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int,
        payloads: MutableList<Any>
    ) {
        if (payloads.isEmpty()) {
            super.onBindViewHolder(holder, position, payloads)
        } else {
            Log.d(TAG, "onBindViewHolder with payloads at $position: $payloads")
            // Здесь можно обрабатывать частичные обновления
            onBindViewHolder(holder, position)
        }
    }

    override fun onViewRecycled(holder: RecyclerView.ViewHolder) {
        super.onViewRecycled(holder)
        Log.d(TAG, "onViewRecycled for holder at position ${holder.adapterPosition}")
        if (holder is MessageViewHolder) {
            holder.bubbleView.prepareForReuse()
        }
    }

    override fun onViewAttachedToWindow(holder: RecyclerView.ViewHolder) {
        super.onViewAttachedToWindow(holder)
        Log.d(TAG, "onViewAttachedToWindow at position ${holder.adapterPosition}")
    }

    override fun onViewDetachedFromWindow(holder: RecyclerView.ViewHolder) {
        super.onViewDetachedFromWindow(holder)
        Log.d(TAG, "onViewDetachedFromWindow at position ${holder.adapterPosition}")
    }

    override fun onAttachedToRecyclerView(recyclerView: RecyclerView) {
        super.onAttachedToRecyclerView(recyclerView)
        Log.d(TAG, "onAttachedToRecyclerView")
    }

    override fun onDetachedFromRecyclerView(recyclerView: RecyclerView) {
        super.onDetachedFromRecyclerView(recyclerView)
        Log.d(TAG, "onDetachedFromRecyclerView")
    }

    // ─── Highlight ────────────────────────────────────────────────────────

    fun highlightItem(recyclerView: RecyclerView, position: Int) {
        Log.d(TAG, "highlightItem at position $position")
        val holder = recyclerView.findViewHolderForAdapterPosition(position) ?: run {
            Log.d(TAG, "highlightItem: holder not found at position $position")
            return
        }
        val view = holder.itemView
        Log.d(TAG, "highlightItem: starting animation on view $view")
        ValueAnimator.ofFloat(1f, 0.35f, 1f, 0.6f, 1f).apply {
            duration = 600
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                view.alpha = it.animatedValue as Float
            }
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    Log.d(TAG, "highlightItem animation ended at position $position")
                }
            })
            start()
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────

    private fun buildFlatList(sections: List<MessageSection>): List<ListItem> {
        Log.d(TAG, "buildFlatList with ${sections.size} sections")
        val list = mutableListOf<ListItem>()
        var totalMessages = 0

        for ((index, section) in sections.withIndex()) {
            Log.d(TAG, "  Section $index: dateKey=${section.dateKey}, messages=${section.messages.size}")
            list.add(ListItem.DateItem(section.dateKey, DateHelper.sectionTitle(section.dateKey)))
            totalMessages += section.messages.size
            section.messages.forEach { msg ->
                list.add(ListItem.MessageItem(msg))
            }
        }

        Log.d(TAG, "buildFlatList completed: ${list.size} total items ($totalMessages messages, ${sections.size} date headers)")
        return list
    }

    private fun resolveReply(message: ChatMessage): ResolvedReply? {
        val reply = message.reply ?: return null
        Log.d(TAG, "resolveReply for message ${message.id}, replyToId=${reply.replyToId}")

        val original = messageIndex[reply.replyToId]
        val result = if (original != null) {
            Log.d(TAG, "  Reply resolved: found original message ${original.id}")
            ResolvedReply.Found(ReplyDisplayInfo.from(original))
        } else {
            Log.d(TAG, "  Reply resolved: original message deleted")
            ResolvedReply.Deleted
        }
        return result
    }

    // ─── DiffCallback ─────────────────────────────────────────────────────

    private class ItemDiffCallback(
        private val old: List<ListItem>,
        private val new: List<ListItem>,
    ) : DiffUtil.Callback() {

        init {
            Log.d(TAG, "ItemDiffCallback created: old size=${old.size}, new size=${new.size}")
        }

        override fun getOldListSize(): Int {
            return old.size
        }

        override fun getNewListSize(): Int {
            return new.size
        }

        override fun areItemsTheSame(oldPos: Int, newPos: Int): Boolean {
            val o = old[oldPos]
            val n = new[newPos]

            val result = when {
                o is ListItem.DateItem && n is ListItem.DateItem -> {
                    val same = o.dateKey == n.dateKey
                    Log.d(TAG, "areItemsTheSame [DateItem] oldPos=$oldPos, newPos=$newPos: ${o.dateKey} == ${n.dateKey} = $same")
                    same
                }
                o is ListItem.MessageItem && n is ListItem.MessageItem -> {
                    val same = o.message.id == n.message.id
                    Log.d(TAG, "areItemsTheSame [MessageItem] oldPos=$oldPos, newPos=$newPos: ${o.message.id} == ${n.message.id} = $same")
                    same
                }
                else -> {
                    Log.d(TAG, "areItemsTheSame [Different types] oldPos=$oldPos (${o.javaClass.simpleName}), newPos=$newPos (${n.javaClass.simpleName}) = false")
                    false
                }
            }

            // Особое внимание на удаленные сообщения
            if (!result && o is ListItem.MessageItem && n !is ListItem.MessageItem) {
                Log.d(TAG, "  → Message ${o.message.id} was REMOVED at position $oldPos")
            }
            if (!result && o !is ListItem.MessageItem && n is ListItem.MessageItem) {
                Log.d(TAG, "  → Message ${n.message.id} was ADDED at position $newPos")
            }

            return result
        }

        override fun areContentsTheSame(oldPos: Int, newPos: Int): Boolean {
            val o = old[oldPos]
            val n = new[newPos]

            val result = when {
                o is ListItem.DateItem && n is ListItem.DateItem -> {
                    val same = o.dateKey == n.dateKey && o.title == n.title
                    Log.d(TAG, "areContentsTheSame [DateItem] oldPos=$oldPos, newPos=$newPos: $same")
                    same
                }
                o is ListItem.MessageItem && n is ListItem.MessageItem -> {
                    // Проверяем изменилось ли содержимое сообщения
                    val same = o.message == n.message
                    if (!same) {
                        Log.d(TAG, "areContentsTheSame [MessageItem] oldPos=$oldPos, newPos=$newPos: content changed")
                        Log.d(TAG, "  old: id=${o.message.id}, text='${o.message.text}', hasImage=${o.message.hasImage}")
                        Log.d(TAG, "  new: id=${n.message.id}, text='${n.message.text}', hasImage=${n.message.hasImage}")
                    }
                    same
                }
                else -> {
                    Log.d(TAG, "areContentsTheSame [Different types] oldPos=$oldPos, newPos=$newPos = false")
                    false
                }
            }

            return result
        }

        override fun getChangePayload(oldPos: Int, newPos: Int): Any? {
            Log.d(TAG, "getChangePayload oldPos=$oldPos, newPos=$newPos")
            return super.getChangePayload(oldPos, newPos)
        }
    }
}

// ─── ViewHolders ──────────────────────────────────────────────────────────────

class DateSeparatorViewHolder(val view: DateSeparatorView) : RecyclerView.ViewHolder(view) {
    fun bind(title: String, theme: ChatTheme) {
        Log.d(TAG, "DateSeparatorViewHolder.bind: title='$title'")
        view.configure(title, theme)
    }
}

class MessageViewHolder(val bubbleView: MessageBubbleView) : RecyclerView.ViewHolder(bubbleView) {
    init {
        Log.d(TAG, "MessageViewHolder created")
    }
}
