package com.rnapp.chat.model

// ─── MessageStatus ────────────────────────────────────────────────────────────

enum class MessageStatus(val raw: String) {
    SENDING("sending"),
    SENT("sent"),
    DELIVERED("delivered"),
    READ("read");

    companion object {
        fun from(raw: String?): MessageStatus = entries.firstOrNull { it.raw == raw } ?: SENT
    }
}

// ─── Domain models ────────────────────────────────────────────────────────────

data class ChatImageItem(
    val url: String,
    val width: Double? = null,
    val height: Double? = null,
    val thumbnailUrl: String? = null,
)

/**
 * Снапшот ссылки на оригинал сообщения (reply).
 * Хранится внутри ChatMessage. Используется как fallback при deleted-оригинале.
 * При рендере используйте resolveReply() из messageIndex для получения
 * актуальных данных оригинала (включая правки).
 */
data class ChatReplyRef(
    val id: String,
    val text: String? = null,
    val senderName: String? = null,
    val hasImages: Boolean? = null,
)

data class ChatMessage(
    val id: String,
    val text: String? = null,
    val images: List<ChatImageItem>? = null,
    /** Unix timestamp в секундах (Double для совместимости с JS). */
    val timestamp: Double,
    val senderName: String? = null,
    val isMine: Boolean = false,
    val status: MessageStatus = MessageStatus.SENT,
    val replyTo: ChatReplyRef? = null,
    val isEdited: Boolean = false,
) {
    val hasText: Boolean get() = !text.isNullOrBlank()
    val hasImage: Boolean get() = !images.isNullOrEmpty()
}

/**
 * Результат резолвинга цитаты по messageIndex в рантайме.
 * Зеркало ResolvedReply из Swift.
 *
 * .Found содержит АКТУАЛЬНЫЕ данные оригинала из messageIndex —
 * при редактировании оригинала все цитаты обновляются автоматически.
 * .Deleted — показываем заглушку.
 */
sealed class ResolvedReply {
    data class Found(val info: ReplyDisplayInfo) : ResolvedReply()
    object Deleted : ResolvedReply()
}

/**
 * Данные для рендера блока цитаты.
 * Строится из живого ChatMessage (messageIndex) или из снапшота (fallback).
 */
data class ReplyDisplayInfo(
    val replyToId: String,
    val senderName: String?,
    val text: String?,
    val hasImage: Boolean,
) {
    companion object {
        fun fromMessage(msg: ChatMessage) = ReplyDisplayInfo(
            replyToId  = msg.id,
            senderName = msg.senderName,
            text       = msg.text,
            hasImage   = msg.hasImage,
        )

        fun fromSnapshot(ref: ChatReplyRef) = ReplyDisplayInfo(
            replyToId  = ref.id,
            senderName = ref.senderName,
            text       = ref.text,
            hasImage   = ref.hasImages == true,
        )
    }
}

data class ChatAction(
    val id: String,
    val title: String,
    val systemImage: String? = null,
    val isDestructive: Boolean = false,
)

data class ChatInputAction(
    val type: String,              // "reply" | "edit"
    val messageId: String? = null,
)

// ─── Adapter list items ───────────────────────────────────────────────────────

/** Дискриминированный union для элементов RecyclerView. */
sealed class ChatListItem {
    data class DateHeader(
        val dateKey: String,   // "yyyy-MM-dd"
        val label: String,     // Локализованная строка: "Today", "Monday" и т.д.
    ) : ChatListItem()

    data class Message(val message: ChatMessage) : ChatListItem()
}

// ─── Scroll position ──────────────────────────────────────────────────────────

enum class ChatScrollPosition { TOP, CENTER, BOTTOM }
