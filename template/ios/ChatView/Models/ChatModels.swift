import UIKit

// MARK: - Message Status

enum MessageStatus: String {
    case sending, sent, delivered, read
}

// MARK: - Content Payloads

struct TextPayload: Equatable, Hashable {
    let text: String
}

struct ImageItem: Equatable, Hashable {
    let url: String
    let width: CGFloat?
    let height: CGFloat?
    let thumbnailUrl: String?
}

struct ImagePayload: Equatable, Hashable {
    let images: [ImageItem]
}

struct VideoPayload: Equatable, Hashable {
    let url: String
    let thumbnailUrl: String?
    let width: CGFloat?
    let height: CGFloat?
    let duration: TimeInterval?
}

struct VoicePayload: Equatable, Hashable {
    let url: String
    let duration: TimeInterval
    let waveform: [Float]
}

struct PollOption: Equatable, Hashable {
    let id: String
    let text: String
    let votes: Int
    let percentage: CGFloat
}

struct PollPayload: Equatable, Hashable {
    let id: String
    let question: String
    let options: [PollOption]
    let totalVotes: Int
    let selectedOptionIds: [String]
    let isMultipleChoice: Bool
    let isClosed: Bool
}

struct FilePayload: Equatable, Hashable {
    let url: String
    let name: String
    let size: Int64
    let mimeType: String?
}

// MARK: - Message Content

enum MessageContent: Equatable, Hashable {
    case text(TextPayload)
    case image(ImagePayload)
    case mixed(TextPayload, ImagePayload)
    case video(VideoPayload)
    case mixedTextVideo(TextPayload, VideoPayload)
    case voice(VoicePayload)
    case poll(PollPayload)
    case file(FilePayload)

    var text: String? {
        switch self {
        case .text(let p): return p.text
        case .mixed(let t, _): return t.text
        case .mixedTextVideo(let t, _): return t.text
        default: return nil
        }
    }

    var images: [ImageItem]? {
        switch self {
        case .image(let p): return p.images
        case .mixed(_, let p): return p.images
        default: return nil
        }
    }

    var video: VideoPayload? {
        switch self {
        case .video(let v): return v
        case .mixedTextVideo(_, let v): return v
        default: return nil
        }
    }

    var voice: VoicePayload? {
        if case .voice(let v) = self { return v }
        return nil
    }

    var poll: PollPayload? {
        if case .poll(let p) = self { return p }
        return nil
    }

    var file: FilePayload? {
        if case .file(let f) = self { return f }
        return nil
    }
}

// MARK: - Reaction

struct Reaction: Equatable, Hashable {
    let emoji: String
    let count: Int
    let isMine: Bool
}

// MARK: - Reply Info

struct ReplyInfo: Equatable, Hashable {
    let replyToId: String
    let senderName: String?
    let text: String?
    let hasImage: Bool
}

// MARK: - Message Action

struct MessageAction: Equatable, Hashable {
    let id: String
    let title: String
    let systemImage: String?
    let isDestructive: Bool
}

// MARK: - Chat Message

struct ChatMessage: Equatable, Hashable {
    let id: String
    let content: MessageContent
    let timestamp: Date
    let senderName: String?
    let isMine: Bool
    let groupDate: String
    let status: MessageStatus
    let reply: ReplyInfo?
    let forwardedFrom: String?
    let reactions: [Reaction]
    let isEdited: Bool
    let actions: [MessageAction]
}

// MARK: - Input Action

enum ChatInputAction: Equatable, Hashable {
    case none
    case reply(messageId: String)
    case edit(messageId: String)
}

// MARK: - Reply Display

struct ReplyDisplayInfo {
    let senderName: String
    let text: String
    let hasImage: Bool
}
