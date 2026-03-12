package com.rnapp.rnchatview

object SectionsBuilder {

    /** Строит список секций, сгруппированных по дате, из плоского списка сообщений. */
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

sealed class UpdateStrategy {
    abstract val sections: List<MessageSection>
    abstract val index: Map<String, ChatMessage>

    data class Prepend(
        override val sections: List<MessageSection>,
        override val index: Map<String, ChatMessage>,
        val prependedCount: Int,
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

/**
 * Определяет оптимальную стратегию обновления адаптера на основе diff между
 * старым и новым наборами сообщений. Возвращает одну из: Prepend, Append, Delete, Update.
 */
fun resolveStrategy(
    newMessages: List<ChatMessage>,
    oldIndex: Map<String, ChatMessage>,
    oldSections: List<MessageSection>,
): UpdateStrategy {
    val newIndex = newMessages.associateBy { it.id }
    val newSections = SectionsBuilder.build(newMessages)
    val newIds = newIndex.keys
    val oldIds = oldIndex.keys

    val added = newIds - oldIds
    val removed = oldIds - newIds

    return when {
        oldIds.isEmpty() ->
            UpdateStrategy.Append(newSections, newIndex)

        removed.isNotEmpty() && added.isEmpty() ->
            UpdateStrategy.Delete(newSections, newIndex, removed.toSet())

        added.isNotEmpty() && removed.isEmpty() -> {
            val prependedCount = countPrepended(oldSections, newSections)
            if (prependedCount > 0)
                UpdateStrategy.Prepend(newSections, newIndex, prependedCount)
            else
                UpdateStrategy.Append(newSections, newIndex)
        }

        else -> {
            val changedIds = newMessages.mapNotNullTo(mutableSetOf()) { msg ->
                val existing = oldIndex[msg.id]
                if (existing == null || existing != msg) msg.id else null
            }
            val quoteReaderIds = newMessages.mapNotNullTo(mutableSetOf()) { msg ->
                val replyId = msg.reply?.replyToId ?: return@mapNotNullTo null
                if (replyId in changedIds && msg.id !in changedIds) msg.id else null
            }
            UpdateStrategy.Update(newSections, newIndex, changedIds + quoteReaderIds)
        }
    }
}

/**
 * Считает количество элементов (сообщения + заголовки секций) добавленных
 * в начало списка. Возвращает 0 если добавление не является prepend.
 */
private fun countPrepended(
    oldSections: List<MessageSection>,
    newSections: List<MessageSection>,
): Int {
    val oldestTimestamp = oldSections.firstOrNull()?.messages?.firstOrNull()?.timestamp
        ?: return 0

    var prependedMessages = 0
    var prependedHeaders = 0

    for (section in newSections) {
        val sectionMsgs = section.messages.filter { it.timestamp < oldestTimestamp }
        if (sectionMsgs.isEmpty()) break
        prependedMessages += sectionMsgs.size
        val sectionExistedBefore = oldSections.any { it.dateKey == section.dateKey }
        if (!sectionExistedBefore) prependedHeaders++
    }

    if (prependedMessages == 0) return 0
    return prependedMessages + prependedHeaders
}
