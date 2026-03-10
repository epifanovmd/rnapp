package com.rnapp.rnchatview

// ─── MessageStatus ────────────────────────────────────────────────────────────

enum class MessageStatus(val raw: String) {
    SENDING("sending"),
    SENT("sent"),
    DELIVERED("delivered"),
    READ("read");

    companion object {
        fun from(raw: String?): MessageStatus =
            entries.firstOrNull { it.raw == raw } ?: SENT
    }
}

// ─── MessageContent ───────────────────────────────────────────────────────────
//
// Sealed hierarchy — точный аналог Swift enum MessageContent.
// Каждый вариант самодостаточен и несёт все данные для рендера.

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

    // Convenience accessors
    val textBody: String?
        get() = when (this) {
            is Text  -> payload.body
            is Mixed -> text.body
            is Image -> null
        }

    val imagePayload: ImagePayload?
        get() = when (this) {
            is Image -> payload
            is Mixed -> image
            is Text  -> null
        }

    val hasText: Boolean  get() = textBody != null
    val hasImage: Boolean get() = imagePayload != null
}

// ─── ReplyInfo ────────────────────────────────────────────────────────────────
//
// Хранит ТОЛЬКО ссылку (replyToId) + снапшот данных в момент ответа.
// Снапшот — fallback для случая .deleted.

data class ReplyInfo(
    val replyToId: String,
    val senderName: String? = null,
    val text: String? = null,
    val hasImage: Boolean = false,
)

// ─── ChatMessage ──────────────────────────────────────────────────────────────

data class ChatMessage(
    val id: String,
    val content: MessageContent,
    val timestamp: Long,          // Unix ms
    val senderName: String? = null,
    val isMine: Boolean = false,
    val groupDate: String = "",   // "yyyy-MM-dd"
    val status: MessageStatus = MessageStatus.SENT,
    val reply: ReplyInfo? = null,
    val isEdited: Boolean = false,
) {
    val text: String?                           get() = content.textBody
    val image: MessageContent.ImagePayload?     get() = content.imagePayload
    val hasText: Boolean                        get() = content.hasText
    val hasImage: Boolean                       get() = content.hasImage
    val replyToId: String?                      get() = reply?.replyToId
}

// ─── MessageAction ────────────────────────────────────────────────────────────

data class MessageAction(
    val id: String,
    val title: String,
    val systemImage: String? = null,
    val isDestructive: Boolean = false,
)

// ─── MessageSection ───────────────────────────────────────────────────────────

data class MessageSection(
    val dateKey: String,          // "yyyy-MM-dd"
    val messages: List<ChatMessage>,
)

// ─── ResolvedReply ────────────────────────────────────────────────────────────
//
// Результат резолвинга ссылки на оригинал сообщения.
// .Found содержит АКТУАЛЬНЫЕ данные из messageIndex.

sealed class ResolvedReply {
    data class Found(val info: ReplyDisplayInfo) : ResolvedReply()
    object Deleted : ResolvedReply()
}

// ─── ReplyDisplayInfo ─────────────────────────────────────────────────────────

data class ReplyDisplayInfo(
    val replyToId: String,
    val senderName: String? = null,
    val text: String? = null,
    val hasImage: Boolean = false,
) {
    companion object {
        /** Строит из живого ChatMessage (актуальные данные). */
        fun from(message: ChatMessage) = ReplyDisplayInfo(
            replyToId  = message.id,
            senderName = message.senderName,
            text       = message.text,
            hasImage   = message.hasImage,
        )

        /** Строит из снапшота для случая deleted (fallback). */
        fun fromSnapshot(info: ReplyInfo) = ReplyDisplayInfo(
            replyToId  = info.replyToId,
            senderName = info.senderName,
            text       = info.text,
            hasImage   = info.hasImage,
        )
    }
}

// ─── InputBarMode ─────────────────────────────────────────────────────────────

sealed class InputBarMode {
    object Normal : InputBarMode()
    data class Reply(val info: ReplyInfo) : InputBarMode()
    data class Edit(val messageId: String, val originalText: String) : InputBarMode()
}

// ─── ChatInputAction (from RN bridge) ────────────────────────────────────────

sealed class ChatInputAction {
    data class Reply(val messageId: String) : ChatInputAction()
    data class Edit(val messageId: String) : ChatInputAction()
    object None : ChatInputAction()

    companion object {
        fun from(type: String?, messageId: String?): ChatInputAction {
            if (messageId.isNullOrBlank()) return None
            return when (type) {
                "reply" -> Reply(messageId!!)
                "edit"  -> Edit(messageId!!)
                else    -> None
            }
        }
    }
}

// ─── ScrollPosition ───────────────────────────────────────────────────────────

enum class ChatScrollPosition { TOP, CENTER, BOTTOM }
