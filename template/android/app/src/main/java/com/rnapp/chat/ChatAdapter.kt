package com.rnapp.chat.adapter

import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.model.ChatListItem
import com.rnapp.chat.model.ChatMessage
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.viewholder.DateHeaderViewHolder
import com.rnapp.chat.viewholder.MessageViewHolder

/**
 * Высокопроизводительный адаптер чата.
 *
 * Ключевые решения:
 *  • DiffUtil.calculateDiff — O(N) diff, минимальные обновления.
 *  • Три ViewType (date / outgoing / incoming) — нет instanceof в onBindViewHolder.
 *  • Payload-based частичные обновления статуса — избегаем полного rebind.
 *  • setHasStableIds(true) + детерминированные Long id — плавные анимации.
 *  • Theme update через PAYLOAD_THEME — пересоздаём только цвета, без measure.
 *  • messageIndex передаётся в bind для resolve цитат (актуальные данные оригинала).
 */
class ChatAdapter(
    private var theme: ChatTheme,
    private val sizeCache: ItemSizeCache,
    private val callbacks: ChatAdapterCallbacks,
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    // ─── Callbacks ────────────────────────────────────────────────────────────

    interface ChatAdapterCallbacks {
        fun onMessageClick(messageId: String)
        fun onMessageLongClick(messageId: String, anchorView: android.view.View)
        fun onReplyClick(messageId: String)
    }

    // ─── Data ─────────────────────────────────────────────────────────────────

    private val items = mutableListOf<ChatListItem>()

    /**
     * Индекс сообщений для O(1) resolve цитат.
     * Обновляется вместе с items через submitList().
     */
    var messageIndex: Map<String, ChatMessage> = emptyMap()
        private set

    // ─── Stable IDs ───────────────────────────────────────────────────────────

    init { setHasStableIds(true) }

    override fun getItemId(position: Int): Long = when (val item = items[position]) {
        is ChatListItem.DateHeader -> item.dateKey.hashCode().toLong() xor Long.MIN_VALUE
        is ChatListItem.Message   -> item.message.id.hashCode().toLong()
    }

    // ─── View types ───────────────────────────────────────────────────────────

    override fun getItemCount() = items.size

    override fun getItemViewType(position: Int) = when (val item = items[position]) {
        is ChatListItem.DateHeader -> VIEW_TYPE_DATE
        is ChatListItem.Message   -> if (item.message.isMine) VIEW_TYPE_OUTGOING else VIEW_TYPE_INCOMING
    }

    // ─── Create / Bind ────────────────────────────────────────────────────────

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        when (viewType) {
            VIEW_TYPE_DATE     -> DateHeaderViewHolder.create(parent, theme)
            VIEW_TYPE_OUTGOING -> MessageViewHolder.create(parent, theme, sizeCache, callbacks, outgoing = true)
            VIEW_TYPE_INCOMING -> MessageViewHolder.create(parent, theme, sizeCache, callbacks, outgoing = false)
            else               -> throw IllegalArgumentException("Unknown viewType=$viewType")
        }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is ChatListItem.DateHeader -> (holder as DateHeaderViewHolder).bind(item, theme)
            is ChatListItem.Message   -> (holder as MessageViewHolder).bind(item.message, messageIndex, theme)
        }
    }

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int,
        payloads: MutableList<Any>,
    ) {
        if (payloads.isEmpty()) {
            onBindViewHolder(holder, position)
            return
        }

        val item = items[position]
        if (item !is ChatListItem.Message || holder !is MessageViewHolder) {
            onBindViewHolder(holder, position)
            return
        }

        payloads.forEach { payload ->
            when (payload) {
                PAYLOAD_STATUS_CHANGED  -> holder.bindStatus(item.message.status)
                PAYLOAD_EDITED_CHANGED  -> holder.bindEdited(item.message.isEdited)
                PAYLOAD_THEME_CHANGED   -> holder.applyTheme(theme)
                else                    -> onBindViewHolder(holder, position)
            }
        }
    }

    // ─── Data update ──────────────────────────────────────────────────────────

    fun submitList(newItems: List<ChatListItem>, newIndex: Map<String, ChatMessage>) {
        val diff = DiffUtil.calculateDiff(ChatDiffCallback(items, newItems))
        items.clear()
        items.addAll(newItems)
        messageIndex = newIndex
        diff.dispatchUpdatesTo(this)
    }

    // ─── Theme update ─────────────────────────────────────────────────────────

    /**
     * Обновляет тему только для видимых ViewHolder через payload —
     * не вызывает measure/layout, только перекраску.
     */
    fun updateTheme(newTheme: ChatTheme) {
        if (theme == newTheme) return
        theme = newTheme
        // Используем payload чтобы избежать полного onBindViewHolder
        notifyItemRangeChanged(0, itemCount, PAYLOAD_THEME_CHANGED)
    }

    // ─── Public helpers ───────────────────────────────────────────────────────

    fun getItem(position: Int): ChatListItem = items[position]

    fun findPositionById(messageId: String): Int =
        items.indexOfFirst { it is ChatListItem.Message && it.message.id == messageId }

    fun getMessage(messageId: String): ChatMessage? = messageIndex[messageId]

    // ─── Constants ────────────────────────────────────────────────────────────

    companion object {
        const val VIEW_TYPE_DATE     = 0
        const val VIEW_TYPE_OUTGOING = 1
        const val VIEW_TYPE_INCOMING = 2

        const val PAYLOAD_STATUS_CHANGED = "status"
        const val PAYLOAD_EDITED_CHANGED = "edited"
        const val PAYLOAD_THEME_CHANGED  = "theme"
    }
}

// ─── DiffCallback ─────────────────────────────────────────────────────────────

private class ChatDiffCallback(
    private val old: List<ChatListItem>,
    private val new: List<ChatListItem>,
) : DiffUtil.Callback() {

    override fun getOldListSize() = old.size
    override fun getNewListSize() = new.size

    override fun areItemsTheSame(oldPos: Int, newPos: Int): Boolean {
        val o = old[oldPos]; val n = new[newPos]
        return when {
            o is ChatListItem.DateHeader && n is ChatListItem.DateHeader -> o.dateKey == n.dateKey
            o is ChatListItem.Message   && n is ChatListItem.Message    -> o.message.id == n.message.id
            else -> false
        }
    }

    override fun areContentsTheSame(oldPos: Int, newPos: Int): Boolean {
        val o = old[oldPos]; val n = new[newPos]
        return when {
            o is ChatListItem.DateHeader && n is ChatListItem.DateHeader -> o.label == n.label
            o is ChatListItem.Message   && n is ChatListItem.Message    -> o.message == n.message
            else -> false
        }
    }

    override fun getChangePayload(oldPos: Int, newPos: Int): Any? {
        val o = old[oldPos]; val n = new[newPos]
        if (o !is ChatListItem.Message || n !is ChatListItem.Message) return null

        val om = o.message; val nm = n.message
        // Только статус изменился — частичное обновление без measure
        if (om.copy(status = nm.status) == nm) return ChatAdapter.PAYLOAD_STATUS_CHANGED
        // Только isEdited изменился
        if (om.copy(isEdited = nm.isEdited) == nm) return ChatAdapter.PAYLOAD_EDITED_CHANGED
        return null
    }
}
