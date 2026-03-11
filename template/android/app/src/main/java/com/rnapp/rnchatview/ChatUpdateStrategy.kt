package com.rnapp.rnchatview

// ─── ChatUpdateStrategy.kt ───────────────────────────────────────────────────
//
// Чистые функции без side-эффектов.
// resolveStrategy() — единственная точка принятия решений об обновлении.

// ─── SectionsBuilder ─────────────────────────────────────────────────────────

object SectionsBuilder {
    fun build(messages: List<ChatMessage>): List<MessageSection> {
        if (messages.isEmpty()) return emptyList()
        val sorted = if (isSorted(messages)) messages else messages.sortedBy { it.timestamp }
        return sorted
            .groupByTo(LinkedHashMap()) { it.groupDate }
            .map { (key, msgs) -> MessageSection(key, msgs) }
    }

    private fun isSorted(list: List<ChatMessage>): Boolean {
        for (i in 1 until list.size) {
            if (list[i].timestamp < list[i - 1].timestamp) return false
        }
        return true
    }
}

// ─── UpdateStrategy ───────────────────────────────────────────────────────────

sealed class UpdateStrategy {
    abstract val sections: List<MessageSection>
    abstract val index: Map<String, ChatMessage>

    data class Prepend(
        override val sections: List<MessageSection>,
        override val index: Map<String, ChatMessage>,
    ) : UpdateStrategy()

    data class Append(
        override val sections: List<MessageSection>,
        override val index: Map<String, ChatMessage>,
    ) : UpdateStrategy()

    data class Delete(
        override val sections: List<MessageSection>,
        override val index: Map<String, ChatMessage>,
        val removedIds: Set<String>,
    ) : UpdateStrategy()

    data class Update(
        override val sections: List<MessageSection>,
        override val index: Map<String, ChatMessage>,
        val changedIds: Set<String>,
    ) : UpdateStrategy()
}

// ─── resolveStrategy ─────────────────────────────────────────────────────────

fun resolveStrategy(
    newMessages: List<ChatMessage>,
    oldIndex: Map<String, ChatMessage>,
    oldSections: List<MessageSection>,
    lastKnownCount: Int,
): UpdateStrategy {
    val newIndex    = newMessages.associateBy { it.id }
    val newSections = SectionsBuilder.build(newMessages)
    val newIds      = newIndex.keys
    val oldIds      = oldIndex.keys

    val added   = newIds - oldIds
    val removed = oldIds - newIds

    return when {
        // Первичная загрузка
        oldIds.isEmpty() ->
            UpdateStrategy.Append(newSections, newIndex)

        // Только удаления
        removed.isNotEmpty() && added.isEmpty() ->
            UpdateStrategy.Delete(newSections, newIndex, removed.toSet())

        // Только добавления — проверяем prepend vs append
        added.isNotEmpty() && removed.isEmpty() -> {
            if (isPrepend(oldSections, newSections, lastKnownCount))
                UpdateStrategy.Prepend(newSections, newIndex)
            else
                UpdateStrategy.Append(newSections, newIndex)
        }

        // Смешанные изменения или обновления содержимого
        else -> {
            val changedIds = newMessages.mapNotNullTo(mutableSetOf()) { msg ->
                val existing = oldIndex[msg.id]
                if (existing == null || existing != msg) msg.id else null
            }
            UpdateStrategy.Update(newSections, newIndex, changedIds)
        }
    }
}

private fun isPrepend(
    oldSections: List<MessageSection>,
    newSections: List<MessageSection>,
    oldCount: Int,
): Boolean {
    val oldestTimestamp = oldSections.firstOrNull()?.messages?.firstOrNull()?.timestamp
        ?: return false
    val allTimestamps = newSections.flatMap { it.messages.map { m -> m.timestamp } }
    val addedCount = allTimestamps.size - oldCount
    if (addedCount <= 0) return false
    return allTimestamps.take(addedCount).all { it < oldestTimestamp }
}
