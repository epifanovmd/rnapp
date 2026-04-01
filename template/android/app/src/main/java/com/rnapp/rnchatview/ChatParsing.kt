package com.rnapp.rnchatview

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val groupDateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

/** Парсит ReadableMap в ChatMessage. Возвращает null если данные невалидны. */
fun ReadableMap.toChatMessage(): ChatMessage? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val timestampMs = if (hasKey("timestamp") && !isNull("timestamp"))
        getDouble("timestamp").toLong() else return null

    val groupDate = groupDateFormatter.format(Date(timestampMs))
    val status = MessageStatus.from(if (hasKey("status")) getString("status") else null)
    val isMine = if (hasKey("isMine")) getBoolean("isMine") else false
    val senderName = if (hasKey("senderName") && !isNull("senderName")) getString("senderName") else null
    val isEdited = if (hasKey("isEdited")) getBoolean("isEdited") else false

    val textBody = if (hasKey("text") && !isNull("text"))
        getString("text")?.takeIf { it.isNotEmpty() } else null

    val imagePayload: MessageContent.ImagePayload? =
        if (hasKey("images") && !isNull("images"))
            getArray("images")?.let { arr -> if (arr.size() > 0) arr.getMap(0)?.toImagePayload() else null }
        else null

    val videoPayload: MessageContent.VideoPayload? =
        if (hasKey("video") && !isNull("video")) getMap("video")?.toVideoPayload() else null

    val pollPayload: MessageContent.PollPayload? =
        if (hasKey("poll") && !isNull("poll")) getMap("poll")?.toPollPayload() else null

    val filePayload: MessageContent.FilePayload? =
        if (hasKey("file") && !isNull("file")) getMap("file")?.toFilePayload() else null

    // Приоритет: poll > file > video > image > text
    val content: MessageContent = when {
        pollPayload != null -> MessageContent.Poll(pollPayload)
        filePayload != null -> MessageContent.File(filePayload)
        videoPayload != null -> {
            if (textBody != null)
                MessageContent.MixedTextVideo(MessageContent.TextPayload(textBody), videoPayload)
            else
                MessageContent.Video(videoPayload)
        }
        textBody != null && imagePayload != null ->
            MessageContent.Mixed(MessageContent.TextPayload(textBody), imagePayload)
        textBody != null ->
            MessageContent.Text(MessageContent.TextPayload(textBody))
        imagePayload != null ->
            MessageContent.Image(imagePayload)
        else -> return null
    }

    val reply = if (hasKey("replyTo") && !isNull("replyTo")) getMap("replyTo")?.toReplyInfo() else null

    val actions: List<MessageAction> = if (hasKey("actions") && !isNull("actions"))
        getArray("actions")?.toMessageActions() ?: emptyList()
    else emptyList()

    return ChatMessage(
        id = id,
        content = content,
        timestamp = timestampMs,
        senderName = senderName,
        isMine = isMine,
        groupDate = groupDate,
        status = status,
        reply = reply,
        isEdited = isEdited,
        actions = actions,
    )
}

fun ReadableMap.toMessageAction(): MessageAction? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val title = getString("title")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageAction(
        id = id,
        title = title,
        systemImage = if (hasKey("systemImage") && !isNull("systemImage")) getString("systemImage") else null,
        isDestructive = if (hasKey("isDestructive")) getBoolean("isDestructive") else false,
    )
}

fun ReadableMap.toChatInputAction(): ChatInputAction = ChatInputAction.from(
    type = if (hasKey("type")) getString("type") else null,
    messageId = if (hasKey("messageId") && !isNull("messageId")) getString("messageId") else null,
)

fun ReadableArray.toChatMessages(): List<ChatMessage> =
    (0 until size()).mapNotNull { getMap(it)?.toChatMessage() }

fun ReadableArray.toMessageActions(): List<MessageAction> =
    (0 until size()).mapNotNull { getMap(it)?.toMessageAction() }

fun ReadableArray.toEmojiList(): List<String> =
    (0 until size()).mapNotNull { getString(it)?.takeIf { s -> s.isNotEmpty() } }

private fun ReadableMap.toImagePayload(): MessageContent.ImagePayload? {
    val url = getString("url")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageContent.ImagePayload(
        url = url,
        width = if (hasKey("width")) getDouble("width").toFloat() else null,
        height = if (hasKey("height")) getDouble("height").toFloat() else null,
        thumbnailUrl = if (hasKey("thumbnailUrl") && !isNull("thumbnailUrl")) getString("thumbnailUrl") else null,
    )
}

private fun ReadableMap.toVideoPayload(): MessageContent.VideoPayload? {
    val url = getString("url")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageContent.VideoPayload(
        url = url,
        thumbnailUrl = if (hasKey("thumbnailUrl") && !isNull("thumbnailUrl")) getString("thumbnailUrl") else null,
        width = if (hasKey("width")) getDouble("width").toFloat() else null,
        height = if (hasKey("height")) getDouble("height").toFloat() else null,
        duration = if (hasKey("duration")) getDouble("duration") else null,
    )
}

private fun ReadableMap.toPollPayload(): MessageContent.PollPayload? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val question = getString("question")?.takeIf { it.isNotEmpty() } ?: return null
    val optArr = if (hasKey("options") && !isNull("options")) getArray("options") else return null
    val options = (0 until optArr!!.size()).mapNotNull { optArr.getMap(it)?.toPollOption() }
    if (options.isEmpty()) return null
    return MessageContent.PollPayload(
        id = id,
        question = question,
        options = options,
        totalVotes = if (hasKey("totalVotes")) getDouble("totalVotes").toInt() else 0,
        selectedOptionId = if (hasKey("selectedOptionId") && !isNull("selectedOptionId")) getString("selectedOptionId") else null,
        isClosed = if (hasKey("isClosed")) getBoolean("isClosed") else false,
    )
}

private fun ReadableMap.toPollOption(): MessageContent.PollOption? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    val text = getString("text")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageContent.PollOption(
        id = id,
        text = text,
        votes = if (hasKey("votes")) getDouble("votes").toInt() else 0,
        percentage = if (hasKey("percentage")) getDouble("percentage").toFloat() else 0f,
    )
}

private fun ReadableMap.toFilePayload(): MessageContent.FilePayload? {
    val url = getString("url")?.takeIf { it.isNotEmpty() } ?: return null
    val name = getString("name")?.takeIf { it.isNotEmpty() } ?: return null
    return MessageContent.FilePayload(
        url = url,
        name = name,
        size = if (hasKey("size")) getDouble("size").toLong() else 0,
        mimeType = if (hasKey("mimeType") && !isNull("mimeType")) getString("mimeType") else null,
    )
}

private fun ReadableMap.toReplyInfo(): ReplyInfo? {
    val id = getString("id")?.takeIf { it.isNotEmpty() } ?: return null
    return ReplyInfo(
        replyToId = id,
        snapshotSenderName = if (hasKey("senderName") && !isNull("senderName")) getString("senderName") else null,
        snapshotText = if (hasKey("text") && !isNull("text")) getString("text") else null,
        snapshotHasImage = if (hasKey("hasImages")) getBoolean("hasImages") else false,
    )
}
