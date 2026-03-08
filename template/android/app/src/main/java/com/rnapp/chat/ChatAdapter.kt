package com.rnapp.chat.adapter

import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.model.*
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.ItemSizeCache
import com.rnapp.chat.viewholder.*

/**
 * Высокопроизводительный адаптер чата.
 *
 * Ключевые решения:
 *  • DiffUtil.calculateDiff — O(N) diff, не перерисовываем весь список.
 *  • ViewType per sealed class — нет instanceof в bind().
 *  • ItemSizeCache — кэш высот, позволяет LinearLayoutManager не делать
 *    полный measure при скролле назад.
 *  • setHasStableIds(true) + уникальные Long id — анимации без мерцания.
 */
class ChatAdapter(
    private var theme: ChatTheme,
    private val sizeCache: ItemSizeCache,
    private val callbacks: ChatAdapterCallbacks,
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    interface ChatAdapterCallbacks {
        fun onMessageClick(messageId: String)
        fun onMessageLongClick(messageId: String, holder: RecyclerView.ViewHolder)
        fun onReplyClick(messageId: String)
    }

    private val items = mutableListOf<ChatListItem>()

    // Stable ids: hash строки id
    init { setHasStableIds(true) }

    override fun getItemId(position: Int): Long = when (val item = items[position]) {
        is ChatListItem.DateHeader -> item.dateKey.hashCode().toLong() xor Long.MIN_VALUE
        is ChatListItem.Message   -> item.message.id.hashCode().toLong()
    }

    override fun getItemCount() = items.size

    override fun getItemViewType(position: Int) = when (items[position]) {
        is ChatListItem.DateHeader      -> VIEW_TYPE_DATE
        is ChatListItem.Message -> {
            val msg = (items[position] as ChatListItem.Message).message
            if (msg.isMine) VIEW_TYPE_OUTGOING else VIEW_TYPE_INCOMING
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder =
        when (viewType) {
            VIEW_TYPE_DATE     -> DateHeaderViewHolder.create(parent, theme)
            VIEW_TYPE_OUTGOING -> MessageViewHolder.create(parent, theme, sizeCache, callbacks, outgoing = true)
            VIEW_TYPE_INCOMING -> MessageViewHolder.create(parent, theme, sizeCache, callbacks, outgoing = false)
            else               -> throw IllegalArgumentException("Unknown viewType $viewType")
        }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is ChatListItem.DateHeader -> (holder as DateHeaderViewHolder).bind(item)
            is ChatListItem.Message   -> (holder as MessageViewHolder).bind(item.message)
        }
    }

    // ── Data update ───────────────────────────────────────────────────────

    fun submitList(newItems: List<ChatListItem>) {
        val diff = DiffUtil.calculateDiff(ChatDiffCallback(items, newItems))
        items.clear()
        items.addAll(newItems)
        diff.dispatchUpdatesTo(this)
    }

    fun getItem(position: Int): ChatListItem = items[position]

    fun findPositionById(messageId: String): Int =
        items.indexOfFirst { it is ChatListItem.Message && it.message.id == messageId }

    // ── Theme update ──────────────────────────────────────────────────────

    fun updateTheme(newTheme: ChatTheme) {
        theme = newTheme
        notifyItemRangeChanged(0, itemCount)
    }

    companion object {
        const val VIEW_TYPE_DATE     = 0
        const val VIEW_TYPE_OUTGOING = 1
        const val VIEW_TYPE_INCOMING = 2
    }
}

// ── DiffCallback ──────────────────────────────────────────────────────────────

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
        // Возвращаем payload для частичного обновления (только статус/время)
        val o = old[oldPos]; val n = new[newPos]
        if (o is ChatListItem.Message && n is ChatListItem.Message) {
            if (o.message.copy(status = n.message.status) == n.message) {
                return PAYLOAD_STATUS_CHANGED
            }
        }
        return null
    }

    companion object {
        const val PAYLOAD_STATUS_CHANGED = "status"
    }
}
