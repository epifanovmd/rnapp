package com.rnapp.rnchatview

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

sealed class MessageContent {

    data class TextPayload(val body: String)

    data class ImagePayload(
        val url: String,
        val width: Float? = null,
        val height: Float? = null,
        val thumbnailUrl: String? = null,
    )

    data class VideoPayload(
        val url: String,
        val thumbnailUrl: String? = null,
        val width: Float? = null,
        val height: Float? = null,
        val duration: Double? = null,
    )

    data class PollOption(
        val id: String,
        val text: String,
        val votes: Int = 0,
        val percentage: Float = 0f,
    )

    data class PollPayload(
        val id: String,
        val question: String,
        val options: List<PollOption>,
        val totalVotes: Int = 0,
        val selectedOptionId: String? = null,
        val isClosed: Boolean = false,
    )

    data class VoicePayload(
        val url: String,
        val duration: Double = 0.0,
        val waveform: List<Float> = emptyList(),
    )

    data class FilePayload(
        val url: String,
        val name: String,
        val size: Long = 0,
        val mimeType: String? = null,
    )

    data class Text(val payload: TextPayload) : MessageContent()
    data class Image(val payload: ImagePayload) : MessageContent()
    data class Mixed(val text: TextPayload, val image: ImagePayload) : MessageContent()
    data class Video(val payload: VideoPayload) : MessageContent()
    data class MixedTextVideo(val text: TextPayload, val video: VideoPayload) : MessageContent()
    data class Voice(val payload: VoicePayload) : MessageContent()
    data class Poll(val payload: PollPayload) : MessageContent()
    data class File(val payload: FilePayload) : MessageContent()

    val textBody: String? get() = when (this) {
        is Text -> payload.body
        is Mixed -> text.body
        is MixedTextVideo -> text.body
        is Image, is Video, is Voice, is Poll, is File -> null
    }

    val voicePayload: VoicePayload? get() = when (this) {
        is Voice -> payload
        else -> null
    }

    val imagePayload: ImagePayload? get() = when (this) {
        is Image -> payload
        is Mixed -> image
        else -> null
    }

    val videoPayload: VideoPayload? get() = when (this) {
        is Video -> payload
        is MixedTextVideo -> video
        else -> null
    }

    val pollPayload: PollPayload? get() = when (this) {
        is Poll -> payload
        else -> null
    }

    val filePayload: FilePayload? get() = when (this) {
        is File -> payload
        else -> null
    }

    val hasText: Boolean get() = textBody != null
    val hasImage: Boolean get() = imagePayload != null
    val hasVideo: Boolean get() = videoPayload != null
    val hasVoice: Boolean get() = voicePayload != null
    val hasPoll: Boolean get() = pollPayload != null
    val hasFile: Boolean get() = filePayload != null
    val hasMedia: Boolean get() = hasImage || hasVideo
}

data class Reaction(
    val emoji: String,
    val count: Int,
    val isMine: Boolean = false,
)

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
    val forwardedFrom: String? = null,
    val reactions: List<Reaction> = emptyList(),
    val isEdited: Boolean = false,
    val actions: List<MessageAction> = emptyList(),
) {
    val text: String? get() = content.textBody
    val image: MessageContent.ImagePayload? get() = content.imagePayload
    val video: MessageContent.VideoPayload? get() = content.videoPayload
    val voice: MessageContent.VoicePayload? get() = content.voicePayload
    val hasText: Boolean get() = content.hasText
    val hasImage: Boolean get() = content.hasImage
    val hasVideo: Boolean get() = content.hasVideo
    val hasVoice: Boolean get() = content.hasVoice
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
    data class Found(val info: ReplyDisplayInfo) : ResolvedReply()
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
        fun fromLive(message: ChatMessage) = ReplyDisplayInfo(
            replyToId = message.id,
            senderName = message.senderName,
            text = message.text,
            hasImage = message.hasImage,
            isDeleted = false,
        )

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
