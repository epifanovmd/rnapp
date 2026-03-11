package com.rnapp.rnchatview

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ─── ChatParsing.kt ───────────────────────────────────────────────────────────
//
// Парсинг ReadableMap/Array из JS-bridge в доменные модели.
// Изолирован от ChatModels.kt — модели не знают о мосте.

private val groupDateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

fun ReadableMap.toChatMessage(): ChatMessage? {
    val id          = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val timestampMs = if (hasKey("timestamp") && !isNull("timestamp"))
        getDouble("timestamp").toLong() else return null

    val groupDate  = groupDateFormatter.format(Date(timestampMs))
    val status     = MessageStatus.from(if (hasKey("status")) getString("status") else null)
    val isMine     = if (hasKey("isMine")) getBoolean("isMine") else false
    val senderName = if (hasKey("senderName") && !isNull("senderName")) getString("senderName") else null
    val isEdited   = if (hasKey("isEdited")) getBoolean("isEdited") else false

    val textBody = if (hasKey("text") && !isNull("text"))
        getString("text")?.takeIf { it.isNotEmpty() } else null

    val imagePayload: MessageContent.ImagePayload? =
        if (hasKey("images") && !isNull("images"))
            getArray("images")?.let { arr -> if (arr.size() > 0) arr.getMap(0)?.toImagePayload() else null }
        else null

    val content: MessageContent = when {
        textBody != null && imagePayload != null ->
            MessageContent.Mixed(MessageContent.TextPayload(textBody), imagePayload)
        textBody != null ->
            MessageContent.Text(MessageContent.TextPayload(textBody))
        imagePayload != null ->
            MessageContent.Image(imagePayload)
        else -> return null
    }

    val reply = if (hasKey("replyTo") && !isNull("replyTo")) getMap("replyTo")?.toReplyInfo() else null

    return ChatMessage(
        id         = id,
        content    = content,
        timestamp  = timestampMs,
        senderName = senderName,
        isMine     = isMine,
        groupDate  = groupDate,
        status     = status,
        reply      = reply,
        isEdited   = isEdited,
    )
}

private fun ReadableMap.toImagePayload(): MessageContent.ImagePayload? {
    val url = getString("url")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageContent.ImagePayload(
        url          = url,
        width        = if (hasKey("width"))  getDouble("width").toFloat()  else null,
        height       = if (hasKey("height")) getDouble("height").toFloat() else null,
        thumbnailUrl = if (hasKey("thumbnailUrl") && !isNull("thumbnailUrl")) getString("thumbnailUrl") else null,
    )
}

// ReplyInfo хранит только ссылку + snapshot для fallback при удалении
private fun ReadableMap.toReplyInfo(): ReplyInfo? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    return ReplyInfo(
        replyToId           = id,
        snapshotSenderName  = if (hasKey("senderName") && !isNull("senderName")) getString("senderName") else null,
        snapshotText        = if (hasKey("text") && !isNull("text")) getString("text") else null,
        snapshotHasImage    = if (hasKey("hasImages")) getBoolean("hasImages") else false,
    )
}

fun ReadableMap.toMessageAction(): MessageAction? {
    val id    = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val title = getString("title")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageAction(
        id            = id,
        title         = title,
        systemImage   = if (hasKey("systemImage") && !isNull("systemImage")) getString("systemImage") else null,
        isDestructive = if (hasKey("isDestructive")) getBoolean("isDestructive") else false,
    )
}

fun ReadableMap.toChatInputAction(): ChatInputAction = ChatInputAction.from(
    type      = if (hasKey("type")) getString("type") else null,
    messageId = if (hasKey("messageId") && !isNull("messageId")) getString("messageId") else null,
)

fun ReadableArray.toChatMessages(): List<ChatMessage> =
    (0 until size()).mapNotNull { getMap(it)?.toChatMessage() }

fun ReadableArray.toMessageActions(): List<MessageAction> =
    (0 until size()).mapNotNull { getMap(it)?.toMessageAction() }

fun ReadableArray.toEmojiList(): List<String> =
    (0 until size()).mapNotNull { getString(it)?.takeIf { s -> s.isNotEmpty() } }
