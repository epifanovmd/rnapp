package com.rnapp.rnchatview

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ─── ChatUpdateStrategy.kt ───────────────────────────────────────────────────
//
// Определяет тип изменения данных и применяет соответствующую стратегию.
// Точный аналог Chatviewcontroller_updates_.swift.

private val groupDateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

// ─── SectionsBuilder ─────────────────────────────────────────────────────────

object SectionsBuilder {

    /**
     * Группирует сообщения по дате → список MessageSection, отсортированных по времени.
     * Оптимизация: проверяем отсортированность перед sort (обычно RN отдаёт уже sorted).
     */
    fun build(messages: List<ChatMessage>): List<MessageSection> {
        if (messages.isEmpty()) return emptyList()

        val sorted = if (isSorted(messages)) messages
                     else messages.sortedBy { it.timestamp }

        val map   = LinkedHashMap<String, MutableList<ChatMessage>>()
        for (msg in sorted) {
            map.getOrPut(msg.groupDate) { mutableListOf() }.add(msg)
        }
        return map.map { (key, msgs) -> MessageSection(key, msgs) }
    }

    private fun isSorted(list: List<ChatMessage>): Boolean {
        for (i in 1 until list.size) {
            if (list[i].timestamp < list[i - 1].timestamp) return false
        }
        return true
    }
}

// ─── ChatUpdateStrategy ───────────────────────────────────────────────────────

sealed class UpdateStrategy {
    /** Добавление истории сверху — без анимации + компенсация offset */
    data class Prepend(val sections: List<MessageSection>, val index: Map<String, ChatMessage>) : UpdateStrategy()
    /** Удаление сообщений — с анимацией */
    data class Delete(val sections: List<MessageSection>, val index: Map<String, ChatMessage>, val removedIds: Set<String>) : UpdateStrategy()
    /** Добавление новых сообщений снизу */
    data class Append(val sections: List<MessageSection>, val index: Map<String, ChatMessage>) : UpdateStrategy()
    /** Обновление существующих сообщений */
    data class Update(val sections: List<MessageSection>, val index: Map<String, ChatMessage>, val changedIds: Set<String>) : UpdateStrategy()
}

fun resolveStrategy(
    newMessages: List<ChatMessage>,
    oldIndex: Map<String, ChatMessage>,
    oldSections: List<MessageSection>,
    lastKnownCount: Int,
): UpdateStrategy {
    val newCount   = newMessages.size
    val oldCount   = lastKnownCount
    val newIndex   = newMessages.associateBy { it.id }
    val newSections = SectionsBuilder.build(newMessages)

    val newIds = newMessages.map { it.id }.toSet()
    val oldIds = oldIndex.keys.toSet()
    val hasAdditions = (newIds - oldIds).isNotEmpty()
    val hasDeletions = (oldIds - newIds).isNotEmpty()

    return when {
        newCount > oldCount && oldCount > 0 && isPrepend(oldSections, newSections, oldCount) ->
            UpdateStrategy.Prepend(newSections, newIndex)

        hasDeletions && !hasAdditions -> {
            val removedIds = oldIds - newIds
            UpdateStrategy.Delete(newSections, newIndex, removedIds)
        }

        hasAdditions && !hasDeletions ->
            UpdateStrategy.Append(newSections, newIndex)

        else -> {
            val changedIds = newMessages.mapNotNull { msg ->
                val existing = oldIndex[msg.id]
                if (existing == null || existing != msg) msg.id else null
            }.toSet()
            UpdateStrategy.Update(newSections, newIndex, changedIds)
        }
    }
}

private fun isPrepend(
    oldSections: List<MessageSection>,
    newSections: List<MessageSection>,
    oldCount: Int,
): Boolean {
    val oldestTimestamp = oldSections.firstOrNull()?.messages?.firstOrNull()?.timestamp ?: return false
    val allTimestamps   = newSections.flatMap { it.messages.map { m -> m.timestamp } }
    val addedCount      = allTimestamps.size - oldCount
    if (addedCount <= 0) return false
    return allTimestamps.take(addedCount).all { it < oldestTimestamp }
}
