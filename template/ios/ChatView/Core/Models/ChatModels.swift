// MARK: - ChatModels.swift
// Доменные модели чата. Единственная точка истины для всех структур данных.
//
// Добавление нового типа контента:
//   1. Добавить case в MessageContent + вложенный Payload
//   2. Реализовать MessageContentView в MessageContentViews.swift
//   3. Добавить case в MessageContentViewFactory
//   4. Добавить case в MessageSizeCalculator.contentHeight(for:bubbleWidth:)
//
// Reply-архитектура:
//   • ChatMessage.reply (ReplyInfo) — неизменяемый снапшот момента отправки.
//   • ResolvedReply — результат резолвинга в рантайме через messageIndex.
//   • ReplyInfo.staticSnapshot используется только как fallback когда оригинал удалён.

import Foundation

// MARK: - MessageStatus

enum MessageStatus: String {
    case sending   = "sending"
    case sent      = "sent"
    case delivered = "delivered"
    case read      = "read"
}

// MARK: - MessageContent

/// Версионированный sealed-тип контента сообщения.
/// Каждый case самодостаточен и несёт все данные для рендера.
enum MessageContent {
    case text(TextPayload)
    case image(ImagePayload)
    case mixed(TextPayload, ImagePayload)
    case video(VideoPayload)
    case mixedTextVideo(TextPayload, VideoPayload)
    case voice(VoicePayload)
    case poll(PollPayload)
    case file(FilePayload)

    // MARK: Payloads

    struct TextPayload: Equatable {
        let body: String
    }

    struct ImagePayload: Equatable {
        let url:          String
        let width:        CGFloat?
        let height:       CGFloat?
        let thumbnailUrl: String?
    }

    struct VoicePayload: Equatable {
        let url:      String
        let duration: TimeInterval
        let waveform: [CGFloat]
    }

    struct VideoPayload: Equatable {
        let url:          String
        let thumbnailUrl: String?
        let width:        CGFloat?
        let height:       CGFloat?
        let duration:     TimeInterval?
    }

    struct PollOption: Equatable {
        let id:         String
        let text:       String
        let votes:      Int
        let percentage: CGFloat
    }

    struct PollPayload: Equatable {
        let id:                String
        let question:          String
        let options:           [PollOption]
        let totalVotes:        Int
        let selectedOptionIds: [String]
        let isMultipleChoice:  Bool
        let isClosed:          Bool
    }

    struct FilePayload: Equatable {
        let url:      String
        let name:     String
        let size:     Int64
        let mimeType: String?
    }

    // MARK: Convenience accessors

    var text: String? {
        switch self {
        case .text(let p):              return p.body
        case .mixed(let p, _):          return p.body
        case .mixedTextVideo(let p, _): return p.body
        case .image, .video, .voice, .poll, .file: return nil
        }
    }

    var voice: VoicePayload? {
        if case .voice(let p) = self { return p }
        return nil
    }

    var image: ImagePayload? {
        switch self {
        case .image(let p):    return p
        case .mixed(_, let p): return p
        default:               return nil
        }
    }

    var video: VideoPayload? {
        switch self {
        case .video(let p):              return p
        case .mixedTextVideo(_, let p):  return p
        default:                         return nil
        }
    }

    var poll: PollPayload? {
        if case .poll(let p) = self { return p }
        return nil
    }

    var file: FilePayload? {
        if case .file(let p) = self { return p }
        return nil
    }

    var hasText:  Bool { text  != nil }
    var hasImage: Bool { image != nil }
    var hasVideo: Bool { video != nil }
    var hasVoice: Bool { voice != nil }
    var hasPoll:  Bool { poll  != nil }
    var hasFile:  Bool { file  != nil }

    /// true если контент содержит медиа (изображение или видео) — используется для ширины пузыря.
    var hasMedia: Bool { hasImage || hasVideo }
}

extension MessageContent: Equatable {
    static func == (lhs: MessageContent, rhs: MessageContent) -> Bool {
        switch (lhs, rhs) {
        case (.text(let l),           .text(let r)):              return l == r
        case (.image(let l),          .image(let r)):             return l == r
        case (.mixed(let lt, let li), .mixed(let rt, let ri)):    return lt == rt && li == ri
        case (.video(let l),          .video(let r)):             return l == r
        case (.mixedTextVideo(let lt, let lv), .mixedTextVideo(let rt, let rv)):
            return lt == rt && lv == rv
        case (.voice(let l),          .voice(let r)):             return l == r
        case (.poll(let l),           .poll(let r)):              return l == r
        case (.file(let l),           .file(let r)):              return l == r
        default:                                                   return false
        }
    }
}

// MARK: - Reaction

struct Reaction: Equatable {
    let emoji:  String
    let count:  Int
    let isMine: Bool
}

// MARK: - ReplyInfo

struct ReplyInfo: Equatable {
    let replyToId:  String
    let senderName: String?
    let text:       String?
    let hasImage:   Bool
}

// MARK: - ChatMessage

struct ChatMessage: Identifiable, Equatable {
    let id:            String
    let content:       MessageContent
    let timestamp:     Date
    let senderName:    String?
    let isMine:        Bool
    let groupDate:     String
    let status:        MessageStatus
    let reply:         ReplyInfo?
    let forwardedFrom: String?
    let reactions:     [Reaction]
    let isEdited:      Bool
    let actions:       [MessageAction]

    // MARK: Convenience

    var text:      String?                      { content.text }
    var image:     MessageContent.ImagePayload? { content.image }
    var video:     MessageContent.VideoPayload? { content.video }
    var voice:     MessageContent.VoicePayload? { content.voice }
    var hasText:   Bool                         { content.hasText }
    var hasImage:  Bool                         { content.hasImage }
    var hasVideo:  Bool                         { content.hasVideo }
    var hasVoice:  Bool                         { content.hasVoice }
    var replyToId: String?                      { reply?.replyToId }
}

// MARK: - MessageAction

struct MessageAction: Equatable {
    let id:            String
    let title:         String
    let systemImage:   String?
    let isDestructive: Bool
}

// MARK: - MessageActionRepresentable

protocol MessageActionRepresentable {
    var id:            String  { get }
    var title:         String  { get }
    var systemImage:   String? { get }
    var isDestructive: Bool    { get }
}

extension MessageAction:    MessageActionRepresentable {}
extension ContextMenuAction: MessageActionRepresentable {}

// MARK: - MessageSection

struct MessageSection {
    let dateKey:  String          // "yyyy-MM-dd"
    var messages: [ChatMessage]
}

// MARK: - ResolvedReply

enum ResolvedReply {
    case found(ReplyDisplayInfo)
    case deleted
}

// MARK: - ReplyDisplayInfo

struct ReplyDisplayInfo: Equatable {
    let replyToId:  String
    let senderName: String?
    let text:       String?
    let hasImage:   Bool

    init(from message: ChatMessage) {
        replyToId  = message.id
        senderName = message.senderName
        text       = message.text
        hasImage   = message.hasImage
    }

    init(fromSnapshot info: ReplyInfo) {
        replyToId  = info.replyToId
        senderName = info.senderName
        text       = info.text
        hasImage   = info.hasImage
    }
}
