package com.rnapp.chat.utils

import com.rnapp.chat.model.ChatListItem

/**
 * Кэш высот ячеек RecyclerView по id сообщения.
 * Позволяет RecyclerView избегать повторного measure для уже отрисованных ячеек,
 * что критично для плавного скролла в длинных списках.
 *
 * Использование:
 *   val cache = ItemSizeCache()
 *   cache.put(messageId, height)
 *   val h = cache.get(messageId) // -1 если нет в кэше
 */
class ItemSizeCache {
    private val cache = HashMap<String, Int>(128)

    fun put(id: String, height: Int) { cache[id] = height }
    fun get(id: String): Int = cache[id] ?: -1
    fun has(id: String): Boolean = cache.containsKey(id)
    fun remove(id: String) { cache.remove(id) }
    fun clear() { cache.clear() }

    /** FIX #4: получить высоту элемента по ChatListItem — null если не в кэше. */
    fun getHeight(item: ChatListItem): Int? {
        val key = when (item) {
            is ChatListItem.Message    -> item.message.id
            is ChatListItem.DateHeader -> "date_${item.dateKey}"
        }
        val h = cache[key] ?: return null
        return if (h > 0) h else null
    }
}
