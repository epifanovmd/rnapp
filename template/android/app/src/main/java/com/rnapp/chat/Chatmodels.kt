package com.rnapp.chat.model

/**
 * Доменные модели чата — полный эквивалент типов из NativeChatViewSpec.ts.
 */

data class ChatImageItem(
    val url: String,
    val width: Double? = null,
    val height: Double? = null,
    val thumbnailUrl: String? = null,
)

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
    val timestamp: Double,
    val senderName: String? = null,
    val isMine: Boolean = false,
    val status: String? = null,   // "sending" | "sent" | "delivered" | "read"
    val replyTo: ChatReplyRef? = null,
    val isEdited: Boolean = false,
)

data class ChatAction(
    val id: String,
    val title: String,
    val systemImage: String? = null,
    val isDestructive: Boolean = false,
)

data class ChatInputAction(
    val type: String,             // "reply" | "edit" | "none"
    val messageId: String? = null,
)

// ── List items (adapter items) ────────────────────────────────────────────────

/** Элемент списка RecyclerView — дискриминированный union. */
sealed class ChatListItem {

    /** Разделитель даты (sticky header). */
    data class DateHeader(
        val dateKey: String,   // "yyyy-MM-dd" — ключ секции
        val label: String,     // Локализованная строка ("Сегодня", "Monday" и т.д.)
    ) : ChatListItem()

    /** Пузырь сообщения. */
    data class Message(val message: ChatMessage) : ChatListItem()
}

// ── Events ────────────────────────────────────────────────────────────────────

data class EmojiReactionSelectEvent(val emoji: String, val messageId: String)
data class MessagePressEvent(val messageId: String)
data class ActionPressEvent(val actionId: String, val messageId: String)
data class SendMessageEvent(val text: String, val replyToId: String? = null)
data class EditMessageEvent(val text: String, val messageId: String)
data class CancelInputActionEvent(val type: String)
data class ReplyMessagePressEvent(val messageId: String)
data class ReachTopEvent(val distanceFromTop: Double)
data class ScrollEvent(val x: Double, val y: Double)
data class MessagesVisibleEvent(val messageIds: List<String>)
