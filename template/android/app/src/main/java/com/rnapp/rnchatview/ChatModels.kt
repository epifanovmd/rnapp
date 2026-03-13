package com.rnapp.rnchatview

enum class MessageStatus(val raw: String) {
    SENDING("sending"),
    SENT("sent"),
    DELIVERED("delivered"),
    READ("read");

    companion object {
        /** Создаёт статус из строки, возвращает SENT если строка не распознана. */
        fun from(raw: String?): MessageStatus =
            entries.firstOrNull { it.raw == raw } ?: SENT
    }
}

sealed class MessageContent {

    data class TextPayload(val body: String)

    data class ImagePayload(
        val url: String,
        val width: Float? = null,
        val height: Float? = null,
        val thumbnailUrl: String? = null,
    )

    data class Text(val payload: TextPayload) : MessageContent()
    data class Image(val payload: ImagePayload) : MessageContent()
    data class Mixed(val text: TextPayload, val image: ImagePayload) : MessageContent()

    val textBody: String? get() = when (this) {
        is Text -> payload.body
        is Mixed -> text.body
        is Image -> null
    }

    val imagePayload: ImagePayload? get() = when (this) {
        is Image -> payload
        is Mixed -> image
        is Text -> null
    }

    val hasText: Boolean get() = textBody != null
    val hasImage: Boolean get() = imagePayload != null
}

data class ReplyInfo(
    val replyToId: String,
    val snapshotSenderName: String? = null,
    val snapshotText: String? = null,
    val snapshotHasImage: Boolean = false,
)

data class ChatMessage(
    val id: String,
    val content: MessageContent,
    val timestamp: Long,
    val senderName: String? = null,
    val isMine: Boolean = false,
    val groupDate: String = "",
    val status: MessageStatus = MessageStatus.SENT,
    val reply: ReplyInfo? = null,
    val isEdited: Boolean = false,
) {
    val text: String? get() = content.textBody
    val image: MessageContent.ImagePayload? get() = content.imagePayload
    val hasText: Boolean get() = content.hasText
    val hasImage: Boolean get() = content.hasImage
    val replyToId: String? get() = reply?.replyToId
}

data class MessageAction(
    val id: String,
    val title: String,
    val systemImage: String? = null,
    val isDestructive: Boolean = false,
)

data class MessageSection(
    val dateKey: String,
    val messages: List<ChatMessage>,
)

sealed class ResolvedReply {
    /** Оригинальное сообщение найдено — данные актуальны. */
    data class Found(val info: ReplyDisplayInfo) : ResolvedReply()
    /** Оригинальное сообщение удалено — показываем snapshot. */
    data class Deleted(val info: ReplyDisplayInfo) : ResolvedReply()
}

data class ReplyDisplayInfo(
    val replyToId: String,
    val senderName: String? = null,
    val text: String? = null,
    val hasImage: Boolean = false,
    val isDeleted: Boolean = false,
) {
    companion object {
        /** Создаёт из живого сообщения. */
        fun fromLive(message: ChatMessage) = ReplyDisplayInfo(
            replyToId = message.id,
            senderName = message.senderName,
            text = message.text,
            hasImage = message.hasImage,
            isDeleted = false,
        )

        /** Создаёт из снапшота удалённого сообщения. */
        fun fromSnapshot(info: ReplyInfo) = ReplyDisplayInfo(
            replyToId = info.replyToId,
            senderName = info.snapshotSenderName,
            text = info.snapshotText,
            hasImage = info.snapshotHasImage,
            isDeleted = true,
        )
    }
}

sealed class ChatInputAction {
    data class Reply(val messageId: String) : ChatInputAction()
    data class Edit(val messageId: String) : ChatInputAction()
    object None : ChatInputAction()

    companion object {
        /** Создаёт действие из строк type и messageId, пришедших из JS-bridge. */
        fun from(type: String?, messageId: String?): ChatInputAction {
            if (messageId.isNullOrBlank()) return None
            return when (type) {
                "reply" -> Reply(messageId)
                "edit" -> Edit(messageId)
                else -> None
            }
        }
    }
}

enum class ChatScrollPosition { TOP, CENTER, BOTTOM }
